Add-Type @"
using System;
using System.Runtime.InteropServices;
public class AudioKey {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void TriggerPlay() {
        keybd_event(0xB3, 0, 0, UIntPtr.Zero);
        keybd_event(0xB3, 0, 2, UIntPtr.Zero);
    }
}
"@
[AudioKey]::TriggerPlay()
Write-Output "Media Trigger Success"
