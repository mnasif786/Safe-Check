clear
function Get-PhysicalPath ([string]$siteName, $psSession)
{
    $command = { param($siteName),
        $path = "IIS:\Sites\" + $siteName
        Import-Module WebAdministration
        $physicalPath = (Get-Item $path).PhysicalPath;
        return $physicalPath
		}
	
	Invoke-Command -session $psSession -scriptblock $command -argumentlist $sitename
}

$servers = ("safecheck02","safecheck03")

foreach($server in $servers)
{
	$securePassword = ConvertTo-SecureString "is74rb80pk52" -AsPlainText -force
	$credential = New-Object System.Management.Automation.PsCredential("hq\Continuous.Int",$securePassword)
	$session = New-PSSession -computername $server -credential $credential
	$path = Get-PhysicalPath "EvaluationChecklist.Generator" $session
	
	Write-Host $server $path
	Remove-PSSession -session $session
}

D:\Code\PeninsulaOnline\F5-Files\F5-PoolQuery Safecheck_Web_Servers 
