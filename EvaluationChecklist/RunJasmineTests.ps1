$IE=new-object -com internetexplorer.application
$IE.navigate2("http://localhost:8107/Angular/Tests/SpecRunner.html")
$IE.visible=$true

do {sleep 1} until (-not ($ie.Busy)) 

$doc = $ie.document

    if ($ie.document.documentelement.innerText.Contains('failing') -eq "True") {
        throw "Jasmine test failure"
    }
	
$IE.Quit();