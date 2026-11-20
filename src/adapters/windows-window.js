import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runCommand } from './command.js';

const SCRIPT = `
param([string]$Title, [string]$OutputPath)
$ErrorActionPreference = 'Stop'
Add-Type @'
using System;
using System.Text;
using System.Drawing;
using System.Runtime.InteropServices;
public static class LvefWindow {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc f, IntPtr p);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder t, int c);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public delegate bool EnumWindowsProc(IntPtr h, IntPtr p);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
'@
$found = $null
[LvefWindow]::EnumWindows({ param($h, $p)
  if (-not [LvefWindow]::IsWindowVisible($h)) { return $true }
  $b = New-Object Text.StringBuilder 512
  [void][LvefWindow]::GetWindowText($h, $b, $b.Capacity)
  if ($b.ToString() -like "*$Title*") { $script:found = $h; return $false }
  return $true
}, [IntPtr]::Zero)
if ($null -eq $found) { Write-Error "window title not found: $Title"; exit 4 }
$rect = New-Object LvefWindow+RECT
if (-not [LvefWindow]::GetWindowRect($found, [ref]$rect)) { Write-Error 'GetWindowRect failed'; exit 5 }
$width = $rect.Right - $rect.Left; $height = $rect.Bottom - $rect.Top
if ($width -le 0 -or $height -le 0) { Write-Error 'window has invalid bounds'; exit 6 }
Add-Type -AssemblyName System.Drawing
$bmp = New-Object Drawing.Bitmap($width, $height)
$g = [Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
$bmp.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "captured $width x $height"
`;

export async function captureWindowsWindow({ title, outputPath }) {
  if (process.platform !== 'win32') return { status: 'BLOCKED', reason: 'Windows window capture requires Windows' };
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-window-script-'));
  const scriptPath = path.join(tempDir, 'capture.ps1');
  await fs.writeFile(scriptPath, SCRIPT, 'utf8');
  const result = await runCommand(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Title "${title.replaceAll('"', '`"')}" -OutputPath "${outputPath}"`, { timeoutMs: 15000 });
  if (result.status !== 'PASS') {
    return { status: 'BLOCKED', type: 'desktop-window', reason: result.stderr.trim() || result.error || 'window capture command failed', command: result.command };
  }
  const stat = await fs.stat(outputPath).catch(() => null);
  if (!stat || stat.size <= 100) return { status: 'FAIL', type: 'desktop-window', reason: 'capture produced no valid image' };
  return { status: 'PASS', type: 'desktop-window', path: outputPath, title, size: stat.size };
}
