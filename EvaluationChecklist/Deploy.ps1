param([string[]] $servers, [string]$environment="", $artifactPathUI = "" )
$ErrorActionPreference = "Stop";

if ($environment -eq "")
    {
        throw "ERROR: environment parameter not set"
    }

    if ($server -eq "")
    {
        throw "ERROR: server parameter not set"
    }

function Get-ScriptDirectory
{
    Split-Path $script:MyInvocation.MyCommand.Path
}

function CheckWebsiteRunning($url)
{
	##this function also needs to trigger integration tests?
    write-host "$url checking" 
    
    [net.httpWebRequest] $req = [net.webRequest]::create($url)
    $req.Method = "HEAD"
    $req.Timeout = 600000
	$req.Credentials =  New-Object System.Net.NetworkCredential ("Continuous.Int", "is74rb80pk52")
    
	try {
		[net.httpWebResponse] $res = $req.getResponse()
		return $res.StatusCode -ge "200"
	} catch [Exception] {
		write-host $_.Exception.Message
		return $false;
	}
}

$poolName = "Safecheck_Web_Servers"; #F5 load balancer pool name
# Folder Paths
$pathToSharedFunctions = (Get-ScriptDirectory) + '\DeploySharedFunctions.ps1'
. $pathToSharedFunctions
$pathToBlueGreenDeployment = (Get-ScriptDirectory) + '\BlueGreenDeployment.ps1'
. $pathToBlueGreenDeployment

function Deploy([string] $server, [string] $environment,[string] $siteName, [string] $appPoolName, [string] $greenPath, [string] $bluePath,[string] $artifactPath, $psSession)
{
	write-host "Deployment STARTED"
	if($environment -eq "LIVEEXTERNAL")
    {
		DisableLoadBalancedServer $poolName $server 80
	}
	
	$physicalPath = Get-PhysicalPath $siteName $psSession
	if ($physicalPath -eq $greenPath){
		$destination =  "\\" + $server + "\" + $bluePath.Replace("C:", "C$")
	} else {
		$destination =  "\\" + $server + "\" + $greenPath.Replace("C:", "C$")
	}
	
	write-host "Deploying files from $artifactPath to $destination for environment $environment"
	CopyFolder $artifactPath $destination
	ReplaceWebConfigFile $destination $environment
	UpdateConfig $environment $destination
  	
	#This copies the file to an artifact folder on the UAT server so we have the latest files to copy when deploying to live
	#Otherwise we would have to write some extra code to determine whether the live deployment copies the new files from the green or blue path
	$destinationArtifactPath = "\\" + $server + "\C$\BusinessSafe\Artifacts\EvaluationChecklist.Generator" 
	write-host "Creating artifact -- Copying from $artifactPath to $destinationArtifactPath"
	CopyFolder $artifactPath $destinationArtifactPath
	SwitchVersion $siteName $greenPath $bluePath $psSession
	
	#verify that site is up and running
	$url = "http:\\" + $server +":8107";
	$isWebsiteRunning = CheckWebsiteRunning $url;
	if($isWebsiteRunning)
	{
		write-host "Deployment COMPLETE"  
	}
	else	
	{
		write-host "Deployment Failed - reverting to previous version"  
		SwitchVersion $siteName $greenPath $bluePath $psSession
		throw "Deployment Failed";
	}
	
	if($environment -eq "LIVEEXTERNAL")
    {
		EnableLoadBalancedServer $poolName $server 80
	}
}

function UpdateConfig([string] $environment, [string] $sitePath)
{
	$configFile =  $sitePath + "\Angular\Modules\configService.js"
	$newConfigFile = "$configFile.$environment"
	Remove-Item $configFile
	Copy-Item $newConfigFile $configFile
	write-host "Updated config file from  $newConfigFile to $configFile"
}

$credential;
$session;

foreach($server in $servers)
{
	$securePassword = ConvertTo-SecureString "is74rb80pk52" -AsPlainText -force
	$credential = New-Object System.Management.Automation.PsCredential("hq\Continuous.Int",$securePassword)
	$session = New-PSSession -computername $server -credential $credential
	
	$command = {Deploy $server $environment "EvaluationChecklist.Generator" "EvaluationChecklist.Generator" "C:\inetpub\evaluationchecklist.generator_Green" "C:\inetpub\evaluationchecklist.generator_Blue" $artifactPathUI  $session;}
	Execute-Command $command 1
	
	Remove-PSSession -session $session
}

#revemove all powershell sessions ? Might be a problem if another powershell script is running at the same time
get-pssession | remove-pssession


<# If you get a logon authentication exception when copying files you need to logon onto the computer that is running this script with the user credentials that the script is executing as
For example: when using the CI box (uatbsoci1) to copy to stage (pbsbsostage1)
Logon onto uatbsoci1 using hq\Continuous.int
Get the ip address of pbsbsostage1. 172.16.1.129
Open window explorer and navigate to \\172.16.1.129\c$
Enter the account details for peninsulaonline\developer and check the box to save credentials
Copying files should now work
#>

<# tasks on the ci server
function TransformAndCopyToBuildDirectory($buildDirectory,$projectPath,$transformFileName)
{
	$buildConfigCommand = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe """ + $projectPath + "\" + $transformFileName + """ /target:ALL "
	Invoke-Expression $buildConfigCommand
	if(!(test-path -path $buildDirectory))
	{
		New-Item -ItemType directory -Path $buildDirectory
	}
	Copy-Item  $projectPath\Web.*.Transformed.config $buildDirectory
	Copy-Item  $projectPath\App.*.Transformed.config $buildDirectory
	
	foreach ($file in Get-ChildItem $projectPath\App.*.Transformed.config) {
		$newFileNamePath = $buildDirectory + "\" + ($file.BaseName.Replace("Transformed", "config"))
		Write-Host $file $newFileNamePath 
		Copy-Item $file $newFileNamePath 
	}
}

TransformAndCopyToBuildDirectory "C:\BusinessSafe\Artifacts\EvaluationChecklist.Generator\Configs" "C:\Program Files (x86)\Jenkins\jobs\EvaluationChecklist(SafeCheck)\workspace\EvaluationChecklist.Generator" "Transformer.proj"

function UpdateManifest([string] $sitePath)
{    
        $File = $sitePath + "\angularManifest.appcache"
        $NewIdentifier = "#UniqueIdentifier=" + [Guid]::NewGuid()   
        [regex]$regex="#UniqueIdentifier=.*"   
        (Get-Content ($File))  | Foreach-Object {$_ -replace $regex, "$NewIdentifier"} | Set-Content ($File)
}

UpdateManifest "C:\BusinessSafe\Artifacts\EvaluationChecklist.Generator"

function UpdateVersionNumber([string] $projectPath)
{   
	$versionNumber = Get-Date -format yyyyMMdd-HH:mm:ss;
	[regex]$regex="'versionNumber'*";
	$configFiles = @("angular\modules\configservice.js","angular\modules\configservice.js.uat","angular\modules\configservice.js.live","angular\modules\configservice.js.liveexternal")
	
	Set-Location $projectPath
    foreach ($file in $configFiles)
	{
		$file
		(Get-Content ($file))  | Foreach-Object {$_ -replace $regex, "'$versionNumber'"} | Set-Content ($File)
	}
}

UpdateVersionNumber "C:\BusinessSafe\Artifacts\EvaluationChecklist.Generator"


#>
