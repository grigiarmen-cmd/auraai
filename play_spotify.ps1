Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinUtil {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$procs = Get-Process Spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
$proc = $procs | Select-Object -First 1

if ($proc) {
    [WinUtil]::ShowWindow($proc.MainWindowHandle, 9)
    [WinUtil]::SetForegroundWindow($proc.MainWindowHandle)
    Start-Sleep -Milliseconds 600
    $wshell = New-Object -ComObject wscript.shell
    $wshell.SendKeys('^{l}')
    Start-Sleep -Milliseconds 400
    $query = $args[0]
    if (-not $query) { $query = "Paro NEJ" }
    $wshell.SendKeys($query)
    Start-Sleep -Milliseconds 300
    $wshell.SendKeys('{ENTER}')
    Start-Sleep -Milliseconds 1200
    $wshell.SendKeys('{ENTER}')
    Start-Sleep -Milliseconds 400
    $wshell.SendKeys(' ')
    Write-Output "Played track for: $query"
} else {
    Write-Output "MainWindowHandle not found"
}
