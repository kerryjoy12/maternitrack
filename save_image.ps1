Add-Type -AssemblyName System.Windows.Forms
$image = [System.Windows.Forms.Clipboard]::GetImage()
if ($image) {
  $image.Save('c:\Users\GEORGE\maternity\mother_app\assets\images\login_hero.png')
  Write-Host 'Image saved successfully'
} else {
  Write-Host 'No image found in clipboard'
}
