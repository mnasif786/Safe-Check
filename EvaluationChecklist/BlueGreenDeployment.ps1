
#Use this for IIS7
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

function Set-PhysicalPath([string]$siteName,[string]$physicalPath, $psSession)
{
	$command = { param($siteName,$physicalPath)
            $path = "IIS:\Sites\" + $siteName
			Import-Module WebAdministration
			Set-ItemProperty $path -Name physicalPath  -Value $physicalPath
	}
	
	Invoke-Command -session $psSession -scriptblock $command -argumentlist $sitename, $physicalPath
}

function SwitchVersion([string]$siteName, [string]$greenPath, [string]$bluePath, $psSession)
{    
	$physicalPath = Get-PhysicalPath $siteName $psSession
    
    if ($physicalPath -eq $bluePath)
    {
        write-host "its currently blue, so switch to green"
        Set-PhysicalPath -siteName $siteName -physicalPath $greenPath -psSession $psSession
    }
    elseif ($physicalPath -eq $greenPath)
    {
        write-host "its currently green, so switch to blue"
        Set-PhysicalPath -siteName $siteName -physicalPath $bluePath -psSession $psSession
    }
    else
    {
        $greenPath
        $bluePath
        $physicalPath
        throw "The physical path for ${siteName} is not the green or blue path"
    }
}

function SwitchVersionVirtualDirectory([string]$server,[int]$IISVersion,[string]$siteName,[string]$vDirName,[string]$pathToVDir,[string]$greenPath,[string]$bluePath)
{    
	$physicalPath = Get-VirtualDirectoryPhysicalPathUsingWMI -server $server -siteName $siteName -vDirName $vDirName -pathToVDir $pathToVDir
	#$physicalPath =     Get-VirtualDirectoryPhysicalPathUsingWMI  "pbswebfarm200" "PBSNET" "GUI" "/Root/PBSNET2005"

    if ($physicalPath -eq $bluePath)
    {
        write-host "its currently blue, so switch to green"
        #Set-PhysicalPath -server $server -IISVersion $IISVersion -siteName $siteName -physicalPath $greenPath
		Set-VirtualDirectoryPhysicalPathUsingWMI -server $server -siteName $siteName -vDirName $vDirName -pathToVDir $pathToVDir -physicalPath $greenPath
    }
    elseif ($physicalPath -eq $greenPath)
    {
        write-host "its currently green, so switch to blue"
        #Set-PhysicalPath -server $server -IISVersion $IISVersion -siteName $siteName -physicalPath $greenPath
		Set-VirtualDirectoryPhysicalPathUsingWMI -server $server -siteName $siteName -vDirName $vDirName -pathToVDir $pathToVDir -physicalPath $bluePath
    }
    else
    {
        $greenPath
        $bluePath
        $physicalPath
        throw "The physical path for ${siteName} is not the green or blue path"
    }
}

	#SwitchVersionVirtualDirectory -server "pbsdevmaintws02" -IISVersion 6 -siteName "Default Web Site" -vDirName "GUI" -pathToVDir "/Root/PBSNET2005" -greenPath "C:\inetpub\ClientServicesGUI_Green" -bluePath "C:\inetpub\ClientServicesGUI_Blue" 

 
