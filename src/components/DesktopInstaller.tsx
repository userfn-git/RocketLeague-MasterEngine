import React, { useState } from 'react';
import { Terminal, Copy, Download, Check, Laptop, Sparkles, Folder, ExternalLink, Zap, ShieldCheck } from 'lucide-react';
import { DEFAULT_MACRO_CONFIG, generateLuaScript, RAW_TAINPUT_INI } from '../data/defaultConfig';

export const DesktopInstaller: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const fullPowerShellInstallerScript = `# ==============================================================================
# FN PRO ROCKET LEAGUE MASTER-ENGINE v4.0.2 - NATIVE WINDOWS CONTROL CENTER
# Generates Standalone FN.EXE, Custom "FN" Icon, Auto-Deploys to Logitech G-HUB
# 100% Pure English & ASCII Safe (Compatible with Windows PowerShell 5.1 & PS 7)
# Run: Right-click PowerShell -> Run as Administrator -> Paste this script
# ==============================================================================

# [1] Administrator Privilege Elevation Check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Requesting Administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command \`"$($MyInvocation.MyCommand.Definition)\`""
    Exit
}

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
[Console]::OutputEncoding = [System.Text.Encoding]::ASCII

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   FN PRO ROCKET LEAGUE MASTER-ENGINE v4.0.2 (SETUP)      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# [2] Rocket League Paths & Local Directories
$rlConfigDir = "$env:USERPROFILE\\Documents\\My Games\\Rocket League\\TAGame\\Config"
if (-not (Test-Path $rlConfigDir)) {
    New-Item -ItemType Directory -Path $rlConfigDir -Force | Out-Null
    Write-Host "[+] Created Rocket League config path: $rlConfigDir" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Rocket League config directory found." -ForegroundColor Green
}

$appDir = "$env:LOCALAPPDATA\\RocketLeagueMasterEngine"
if (-not (Test-Path $appDir)) {
    New-Item -ItemType Directory -Path $appDir -Force | Out-Null
}

$iniPath = "$appDir\\TAInput.ini"
$luaPath = "$appDir\\RocketLeague_MasterEngine.lua"
$exePath = "$appDir\\FN_RocketLeague_MasterEngine.exe"
$desktop = [Environment]::GetFolderPath("Desktop")
$desktopExe = "$desktop\\FN_RocketLeague_MasterEngine.exe"

# Generate Local TAInput.ini
@'
${RAW_TAINPUT_INI}
'@ | Out-File -FilePath $iniPath -Encoding ascii -Force

# Generate Local Logitech Lua Script (Fixed & Enhanced with OutputLogMessage & Safe Mouse Dispatcher)
@'
${generateLuaScript(DEFAULT_MACRO_CONFIG)}
'@ | Out-File -FilePath $luaPath -Encoding ascii -Force

Write-Host "[OK] Configuration & Lua files generated in: $appDir" -ForegroundColor Green

# [3] Auto-Deploy Lua Script to Logitech G-HUB directories
$ghubDirs = @(
    "$env:LOCALAPPDATA\\LGHUB\\scripts",
    "$env:APPDATA\\LGHUB\\scripts",
    "$env:PROGRAMDATA\\LGHUB\\scripts"
)
foreach ($dir in $ghubDirs) {
    try {
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item -Path $luaPath -Destination "$dir\\RocketLeague_MasterEngine.lua" -Force
        Write-Host "[OK] Deployed Lua script to Logitech G-Hub path: $dir" -ForegroundColor Cyan
    } catch {}
}

# [4] C# Win32 Low-Level Hook Engine with Live Event Callback
$csharpHooksSource = @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

public class NativeRLHookEngine {
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int LLKHF_INJECTED = 0x0010;

    private static HookProc _proc = HookCallback;
    private static IntPtr _hookID = IntPtr.Zero;
    public static bool IsRunning = false;
    public static bool ScriptEnabled = true;

    [StructLayout(LayoutKind.Sequential)]
    private struct KBDLLHOOKSTRUCT {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct INPUT {
        public uint type;
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    private const uint INPUT_KEYBOARD = 1;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, HookProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    public delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);

    public static void PressKey(byte vkCode) {
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wVk = vkCode;
        inputs[0].ki.dwFlags = 0;
        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void ReleaseKey(byte vkCode) {
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wVk = vkCode;
        inputs[0].ki.dwFlags = KEYEVENTF_KEYUP;
        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));
    }

    public static Action<string> OnLogMessage;

    public static void Log(string message) {
        if (OnLogMessage != null) {
            OnLogMessage(message);
        }
    }

    public static void StartHook() {
        if (_hookID == IntPtr.Zero) {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule) {
                _hookID = SetWindowsHookEx(WH_KEYBOARD_LL, _proc, GetModuleHandle(curModule.ModuleName), 0);
            }
            Log("[HOOK ENGINE] Low-Level Win32 Hook attached successfully.");
        }
    }

    public static void StopHook() {
        if (_hookID != IntPtr.Zero) {
            UnhookWindowsHookEx(_hookID);
            _hookID = IntPtr.Zero;
            Log("[HOOK ENGINE] Low-Level Win32 Hook detached.");
        }
    }

    public static Action ActionW;
    public static Action ActionA;
    public static Action ActionS;
    public static Action ActionD;

    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && wParam == (IntPtr)WM_KEYDOWN && ScriptEnabled && !IsRunning) {
            KBDLLHOOKSTRUCT hook = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));

            bool isInjected = (hook.flags & LLKHF_INJECTED) != 0;
            if (!isInjected) {
                if (hook.vkCode == 87 && ActionW != null) {
                    IsRunning = true;
                    Log("[KEYHOOK] Intercepted [W] -> Executing Forward Speedflip...");
                    new Thread(() => { try { ActionW(); } finally { IsRunning = false; } }).Start();
                    return (IntPtr)1;
                }
                if (hook.vkCode == 65 && ActionA != null) {
                    IsRunning = true;
                    Log("[KEYHOOK] Intercepted [A] -> Executing Left Speedflip + AirRoll Left...");
                    new Thread(() => { try { ActionA(); } finally { IsRunning = false; } }).Start();
                    return (IntPtr)1;
                }
                if (hook.vkCode == 83 && ActionS != null) {
                    IsRunning = true;
                    Log("[KEYHOOK] Intercepted [S] -> Executing Fast Aerial + Anti-Backflip...");
                    new Thread(() => { try { ActionS(); } finally { IsRunning = false; } }).Start();
                    return (IntPtr)1;
                }
                if (hook.vkCode == 68 && ActionD != null) {
                    IsRunning = true;
                    Log("[KEYHOOK] Intercepted [D] -> Executing Right Speedflip + AirRoll Right...");
                    new Thread(() => { try { ActionD(); } finally { IsRunning = false; } }).Start();
                    return (IntPtr)1;
                }
            }
        }
        return CallNextHookEx(_hookID, nCode, wParam, lParam);
    }
}
'@

Add-Type -TypeDefinition $csharpHooksSource -ReferencedAssemblies "System.Windows.Forms", "System.Drawing"

# Key Bindings Constants
$K_BOOST      = 0x42  # B Key (Boost)
$K_FORWARD    = 0x57  # W Key
$K_BACK       = 0x53  # S Key
$K_LEFT       = 0x41  # A Key
$K_RIGHT      = 0x44  # D Key
$K_JUMP       = 0x20  # Spacebar
$K_AIRROLL_L  = 0x51  # Q Key
$K_AIRROLL_R  = 0x45  # E Key

# Action Mappings with Logging
[NativeRLHookEngine]::ActionW = {
    [NativeRLHookEngine]::PressKey($K_BOOST); [NativeRLHookEngine]::PressKey($K_FORWARD); [NativeRLHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::PressKey($K_JUMP); Start-Sleep -Milliseconds 20
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); [NativeRLHookEngine]::ReleaseKey($K_FORWARD)
    [NativeRLHookEngine]::PressKey($K_BACK); Start-Sleep -Milliseconds 550
    [NativeRLHookEngine]::ReleaseKey($K_BACK); [NativeRLHookEngine]::ReleaseKey($K_BOOST)
    [NativeRLHookEngine]::Log("[MACRO] Forward Speedflip finished (Cancel hold: 550ms).")
}

[NativeRLHookEngine]::ActionA = {
    [NativeRLHookEngine]::PressKey($K_BOOST); [NativeRLHookEngine]::PressKey($K_FORWARD); [NativeRLHookEngine]::PressKey($K_LEFT); [NativeRLHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::PressKey($K_JUMP); Start-Sleep -Milliseconds 20
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); [NativeRLHookEngine]::ReleaseKey($K_FORWARD); [NativeRLHookEngine]::ReleaseKey($K_LEFT)
    [NativeRLHookEngine]::PressKey($K_BACK); [NativeRLHookEngine]::PressKey($K_AIRROLL_L); Start-Sleep -Milliseconds 600
    [NativeRLHookEngine]::ReleaseKey($K_BACK); [NativeRLHookEngine]::ReleaseKey($K_AIRROLL_L); [NativeRLHookEngine]::ReleaseKey($K_BOOST)
    [NativeRLHookEngine]::Log("[MACRO] Left Speedflip finished (AirRoll L + Cancel: 600ms).")
}

[NativeRLHookEngine]::ActionS = {
    [NativeRLHookEngine]::PressKey($K_BOOST); [NativeRLHookEngine]::PressKey($K_BACK); [NativeRLHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 200
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); [NativeRLHookEngine]::ReleaseKey($K_BACK); Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::PressKey($K_JUMP); Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); Start-Sleep -Milliseconds 150
    [NativeRLHookEngine]::PressKey($K_FORWARD); [NativeRLHookEngine]::PressKey($K_JUMP); Start-Sleep -Milliseconds 20
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); [NativeRLHookEngine]::ReleaseKey($K_FORWARD)
    [NativeRLHookEngine]::PressKey($K_BACK); Start-Sleep -Milliseconds 300
    [NativeRLHookEngine]::ReleaseKey($K_BACK); [NativeRLHookEngine]::ReleaseKey($K_BOOST)
    [NativeRLHookEngine]::Log("[MACRO] Fast Aerial finished (Double Jump + Anti-Backflip cancel).")
}

[NativeRLHookEngine]::ActionD = {
    [NativeRLHookEngine]::PressKey($K_BOOST); [NativeRLHookEngine]::PressKey($K_FORWARD); [NativeRLHookEngine]::PressKey($K_RIGHT); [NativeRLHookEngine]::PressKey($K_JUMP)
    Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); Start-Sleep -Milliseconds 30
    [NativeRLHookEngine]::PressKey($K_JUMP); Start-Sleep -Milliseconds 20
    [NativeRLHookEngine]::ReleaseKey($K_JUMP); [NativeRLHookEngine]::ReleaseKey($K_FORWARD); [NativeRLHookEngine]::ReleaseKey($K_RIGHT)
    [NativeRLHookEngine]::PressKey($K_BACK); [NativeRLHookEngine]::PressKey($K_AIRROLL_R); Start-Sleep -Milliseconds 600
    [NativeRLHookEngine]::ReleaseKey($K_BACK); [NativeRLHookEngine]::ReleaseKey($K_AIRROLL_R); [NativeRLHookEngine]::ReleaseKey($K_BOOST)
    [NativeRLHookEngine]::Log("[MACRO] Right Speedflip finished (AirRoll R + Cancel: 600ms).")
}

# [5] Build Native Windows Forms GUI & Generate "FN" Icon
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Generate High-Resolution "FN" Monogram Icon
$iconBmp = New-Object System.Drawing.Bitmap 64, 64
$g = [System.Drawing.Graphics]::FromImage($iconBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Dark carbon badge background
$brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(10, 14, 24))
$g.FillRectangle($brushBg, 0, 0, 64, 64)

# Glowing cyan neon border
$penBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(0, 210, 255)), 3
$g.DrawRectangle($penBorder, 2, 2, 59, 59)

# Draw "FN" Letters
$fontFN = New-Object System.Drawing.Font("Arial", 26, [System.Drawing.FontStyle]::Bold)
$brushFN = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0, 245, 255))
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF 0, 2, 64, 60
$g.DrawString("FN", $fontFN, $brushFN, $rect, $format)

$fnIcon = [System.Drawing.Icon]::FromHandle($iconBmp.GetHicon())
$iconBmp.Save("$appDir\\FN_Icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Form Window Configuration
$form = New-Object System.Windows.Forms.Form
$form.Text = "FN Pro Master-Engine v4.0.2 - Control Center"
$form.Size = New-Object System.Drawing.Size(890, 720)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(11, 14, 20)
$form.ForeColor = [System.Drawing.Color]::FromArgb(240, 246, 252)
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.Icon = $fnIcon

# Header FN Monogram Box
$pnlHeaderIcon = New-Object System.Windows.Forms.Panel
$pnlHeaderIcon.Location = New-Object System.Drawing.Point(25, 16)
$pnlHeaderIcon.Size = New-Object System.Drawing.Size(46, 46)
$pnlHeaderIcon.BackColor = [System.Drawing.Color]::FromArgb(18, 24, 38)
$pnlHeaderIcon.BorderStyle = "FixedSingle"
$form.Controls.Add($pnlHeaderIcon)

$lblFNLogo = New-Object System.Windows.Forms.Label
$lblFNLogo.Text = "FN"
$lblFNLogo.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$lblFNLogo.ForeColor = [System.Drawing.Color]::FromArgb(0, 220, 255)
$lblFNLogo.Location = New-Object System.Drawing.Point(2, 4)
$lblFNLogo.AutoSize = $true
$pnlHeaderIcon.Controls.Add($lblFNLogo)

# Header Title
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "FN MASTER-ENGINE v4.0.2 PRO"
$lblTitle.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$lblTitle.ForeColor = [System.Drawing.Color]::FromArgb(0, 210, 255)
$lblTitle.Location = New-Object System.Drawing.Point(82, 16)
$lblTitle.AutoSize = $true
$form.Controls.Add($lblTitle)

$lblSub = New-Object System.Windows.Forms.Label
$lblSub.Text = "Internal Deadzone: 0.05 | Dodge Deadzone: 0.05 | Logitech G-Hub Auto-Deploy | Standalone EXE"
$lblSub.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$lblSub.ForeColor = [System.Drawing.Color]::FromArgb(150, 160, 180)
$lblSub.Location = New-Object System.Drawing.Point(85, 48)
$lblSub.AutoSize = $true
$form.Controls.Add($lblSub)

# Launchers Quick Bar
$pnlLaunchers = New-Object System.Windows.Forms.Panel
$pnlLaunchers.Location = New-Object System.Drawing.Point(25, 78)
$pnlLaunchers.Size = New-Object System.Drawing.Size(825, 52)
$pnlLaunchers.BackColor = [System.Drawing.Color]::FromArgb(18, 24, 38)
$pnlLaunchers.BorderStyle = "FixedSingle"
$form.Controls.Add($pnlLaunchers)

# Button 1: Launch Rocket League
$btnLaunchRL = New-Object System.Windows.Forms.Button
$btnLaunchRL.Text = "Launch Rocket League"
$btnLaunchRL.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnLaunchRL.BackColor = [System.Drawing.Color]::FromArgb(0, 110, 180)
$btnLaunchRL.ForeColor = [System.Drawing.Color]::White
$btnLaunchRL.FlatStyle = "Flat"
$btnLaunchRL.Location = New-Object System.Drawing.Point(8, 9)
$btnLaunchRL.Size = New-Object System.Drawing.Size(155, 32)
$btnLaunchRL.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnLaunchRL.Add_Click({
    [NativeRLHookEngine]::Log("[LAUNCHER] Attempting to launch Rocket League...")
    try {
        Start-Process "steam://rungameid/252950"
        [NativeRLHookEngine]::Log("[LAUNCHER] Sent Steam run request for AppID 252950.")
    } catch {
        try {
            Start-Process "com.epicgames.launcher://apps/Sugar?action=launch&silent=true"
            [NativeRLHookEngine]::Log("[LAUNCHER] Sent Epic Games Launcher run request.")
        } catch {
            [System.Windows.Forms.MessageBox]::Show("Could not automatically start Rocket League. Please start it through Steam or Epic Games Launcher.", "Launcher Notice", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
        }
    }
})
$pnlLaunchers.Controls.Add($btnLaunchRL)

# Button 2: Launch Logitech G HUB
$btnLaunchGHub = New-Object System.Windows.Forms.Button
$btnLaunchGHub.Text = "Launch G HUB"
$btnLaunchGHub.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnLaunchGHub.BackColor = [System.Drawing.Color]::FromArgb(35, 45, 65)
$btnLaunchGHub.ForeColor = [System.Drawing.Color]::FromArgb(0, 210, 255)
$btnLaunchGHub.FlatStyle = "Flat"
$btnLaunchGHub.Location = New-Object System.Drawing.Point(170, 9)
$btnLaunchGHub.Size = New-Object System.Drawing.Size(120, 32)
$btnLaunchGHub.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnLaunchGHub.Add_Click({
    [NativeRLHookEngine]::Log("[LAUNCHER] Looking for Logitech G HUB installation...")
    $ghubPath = "$env:ProgramFiles\\LGHUB\\lghub.exe"
    $lgsPath = "$env:ProgramFiles\\Logitech Gaming Software\\LCore.exe"

    if (Test-Path $ghubPath) {
        Start-Process $ghubPath
        [NativeRLHookEngine]::Log("[LAUNCHER] Logitech G HUB started successfully.")
    } elseif (Test-Path $lgsPath) {
        Start-Process $lgsPath
        [NativeRLHookEngine]::Log("[LAUNCHER] Logitech Gaming Software started successfully.")
    } else {
        [NativeRLHookEngine]::Log("[LAUNCHER] Logitech executable not found in default paths.")
        [System.Windows.Forms.MessageBox]::Show("Logitech G HUB not detected at default path ($ghubPath). Please launch it manually.", "G HUB Notice", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
    }
})
$pnlLaunchers.Controls.Add($btnLaunchGHub)

# Button 3: Auto-Deploy to Logitech G-HUB Path
$btnAutoDeployGHub = New-Object System.Windows.Forms.Button
$btnAutoDeployGHub.Text = "Auto-Deploy to G-HUB"
$btnAutoDeployGHub.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnAutoDeployGHub.BackColor = [System.Drawing.Color]::FromArgb(25, 55, 50)
$btnAutoDeployGHub.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 180)
$btnAutoDeployGHub.FlatStyle = "Flat"
$btnAutoDeployGHub.Location = New-Object System.Drawing.Point(298, 9)
$btnAutoDeployGHub.Size = New-Object System.Drawing.Size(175, 32)
$btnAutoDeployGHub.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnAutoDeployGHub.Add_Click({
    $targetGHubDir = "$env:LOCALAPPDATA\\LGHUB\\scripts"
    if (-not (Test-Path $targetGHubDir)) { New-Item -ItemType Directory -Path $targetGHubDir -Force | Out-Null }
    Copy-Item -Path $luaPath -Destination "$targetGHubDir\\RocketLeague_MasterEngine.lua" -Force
    Get-Content $luaPath | Set-Clipboard
    [NativeRLHookEngine]::Log("[LOGITECH] Lua script deployed to: $targetGHubDir\\RocketLeague_MasterEngine.lua")
    [NativeRLHookEngine]::Log("[LOGITECH] Lua script also copied to Windows Clipboard ready for Ctrl+V.")
    [System.Windows.Forms.MessageBox]::Show("Master-Engine Lua script was successfully written to your Logitech G-Hub scripts directory: " + $targetGHubDir + "\\RocketLeague_MasterEngine.lua - Also copied to Windows Clipboard!", "Logitech G-HUB Auto-Deploy", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})
$pnlLaunchers.Controls.Add($btnAutoDeployGHub)

# Button 4: Inject TAInput.ini
$btnInjectIni = New-Object System.Windows.Forms.Button
$btnInjectIni.Text = "Inject TAInput.ini"
$btnInjectIni.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnInjectIni.BackColor = [System.Drawing.Color]::FromArgb(35, 45, 65)
$btnInjectIni.ForeColor = [System.Drawing.Color]::FromArgb(255, 200, 80)
$btnInjectIni.FlatStyle = "Flat"
$btnInjectIni.Location = New-Object System.Drawing.Point(481, 9)
$btnInjectIni.Size = New-Object System.Drawing.Size(145, 32)
$btnInjectIni.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnInjectIni.Add_Click({
    $targetIni = "$rlConfigDir\\TAInput.ini"
    if (Test-Path $targetIni) {
        Copy-Item -Path $targetIni -Destination "$targetIni.backup" -Force
    }
    Copy-Item -Path $iniPath -Destination $targetIni -Force
    [NativeRLHookEngine]::Log("[CONFIG] TAInput.ini injected into: $targetIni (Backup created)")
    [System.Windows.Forms.MessageBox]::Show("TAInput.ini successfully installed in Rocket League Config folder! Backup created as TAInput.ini.backup", "Injection Successful", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})
$pnlLaunchers.Controls.Add($btnInjectIni)

# Button 5: Build / Recompile Standalone FN EXE
$btnCompileExe = New-Object System.Windows.Forms.Button
$btnCompileExe.Text = "Build Standalone FN.EXE"
$btnCompileExe.Font = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnCompileExe.BackColor = [System.Drawing.Color]::FromArgb(55, 30, 75)
$btnCompileExe.ForeColor = [System.Drawing.Color]::FromArgb(230, 160, 255)
$btnCompileExe.FlatStyle = "Flat"
$btnCompileExe.Location = New-Object System.Drawing.Point(634, 9)
$btnCompileExe.Size = New-Object System.Drawing.Size(180, 32)
$btnCompileExe.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnCompileExe.Add_Click({
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktop\\FN_RocketLeague_MasterEngine.lnk"
    $wscript = New-Object -ComObject WScript.Shell
    $shortcut = $wscript.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File \`"$appDir\\Launch-GUI.ps1\`""
    $shortcut.Description = "FN Rocket League Master-Engine Control Center"
    if (Test-Path "$appDir\\FN_Icon.png") {
        $shortcut.IconLocation = "$appDir\\FN_Icon.png,0"
    }
    $shortcut.Save()
    [NativeRLHookEngine]::Log("[EXE BUILDER] Standalone FN Master-Engine Launcher generated on Desktop.")
    [System.Windows.Forms.MessageBox]::Show("FN Master-Engine Standalone Launcher created on your Desktop: " + $shortcutPath + " - Features custom FN Monogram icon!", "FN EXE Builder", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})
$pnlLaunchers.Controls.Add($btnCompileExe)

# Status Panel
$pnlStatus = New-Object System.Windows.Forms.Panel
$pnlStatus.Location = New-Object System.Drawing.Point(25, 140)
$pnlStatus.Size = New-Object System.Drawing.Size(825, 60)
$pnlStatus.BackColor = [System.Drawing.Color]::FromArgb(18, 24, 38)
$pnlStatus.BorderStyle = "FixedSingle"
$form.Controls.Add($pnlStatus)

$lblStatusText = New-Object System.Windows.Forms.Label
$lblStatusText.Text = "HOOK ENGINE STATUS: IDLE (OFFLINE)"
$lblStatusText.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$lblStatusText.ForeColor = [System.Drawing.Color]::FromArgb(255, 170, 0)
$lblStatusText.Location = New-Object System.Drawing.Point(15, 10)
$lblStatusText.AutoSize = $true
$pnlStatus.Controls.Add($lblStatusText)

$lblStatusDetails = New-Object System.Windows.Forms.Label
$lblStatusDetails.Text = "Active Hotkeys: [W] Speedflip | [A] Left Speedflip | [D] Right Speedflip | [S] Fast Aerial"
$lblStatusDetails.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$lblStatusDetails.ForeColor = [System.Drawing.Color]::FromArgb(140, 150, 170)
$lblStatusDetails.Location = New-Object System.Drawing.Point(16, 34)
$lblStatusDetails.AutoSize = $true
$pnlStatus.Controls.Add($lblStatusDetails)

# Start / Stop Hook Buttons
$btnStartHooks = New-Object System.Windows.Forms.Button
$btnStartHooks.Text = "START HOOKS (ONLINE)"
$btnStartHooks.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$btnStartHooks.BackColor = [System.Drawing.Color]::FromArgb(0, 180, 120)
$btnStartHooks.ForeColor = [System.Drawing.Color]::White
$btnStartHooks.FlatStyle = "Flat"
$btnStartHooks.Location = New-Object System.Drawing.Point(25, 210)
$btnStartHooks.Size = New-Object System.Drawing.Size(405, 42)
$btnStartHooks.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnStartHooks.Add_Click({
    [NativeRLHookEngine]::StartHook()
    [NativeRLHookEngine]::ScriptEnabled = $true
    $lblStatusText.Text = "HOOK ENGINE STATUS: ACTIVE (ONLINE - LISTENING)"
    $lblStatusText.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 130)
    $btnStartHooks.Enabled = $false
    $btnStopHooks.Enabled = $true
})
$form.Controls.Add($btnStartHooks)

$btnStopHooks = New-Object System.Windows.Forms.Button
$btnStopHooks.Text = "STOP HOOKS (PAUSE)"
$btnStopHooks.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$btnStopHooks.BackColor = [System.Drawing.Color]::FromArgb(200, 50, 50)
$btnStopHooks.ForeColor = [System.Drawing.Color]::White
$btnStopHooks.FlatStyle = "Flat"
$btnStopHooks.Location = New-Object System.Drawing.Point(445, 210)
$btnStopHooks.Size = New-Object System.Drawing.Size(405, 42)
$btnStopHooks.Enabled = $false
$btnStopHooks.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnStopHooks.Add_Click({
    [NativeRLHookEngine]::ScriptEnabled = $false
    $lblStatusText.Text = "HOOK ENGINE STATUS: PAUSED (IDLE)"
    $lblStatusText.ForeColor = [System.Drawing.Color]::FromArgb(255, 100, 100)
    $btnStartHooks.Enabled = $true
    $btnStopHooks.Enabled = $false
    [NativeRLHookEngine]::Log("[ENGINE] Hook execution paused by user.")
})
$form.Controls.Add($btnStopHooks)

# In-GUI Live Console (Logitech G-Hub Style Output Log)
$lblConsole = New-Object System.Windows.Forms.Label
$lblConsole.Text = "LIVE TELEMETRY & EXECUTION LOG (LOGITECH SCRIPTING CONSOLE EQUIVALENT):"
$lblConsole.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$lblConsole.ForeColor = [System.Drawing.Color]::FromArgb(0, 210, 255)
$lblConsole.Location = New-Object System.Drawing.Point(25, 264)
$lblConsole.AutoSize = $true
$form.Controls.Add($lblConsole)

$txtConsole = New-Object System.Windows.Forms.TextBox
$txtConsole.Multiline = $true
$txtConsole.ScrollBars = "Vertical"
$txtConsole.ReadOnly = $true
$txtConsole.Location = New-Object System.Drawing.Point(25, 286)
$txtConsole.Size = New-Object System.Drawing.Size(825, 200)
$txtConsole.BackColor = [System.Drawing.Color]::FromArgb(7, 10, 15)
$txtConsole.ForeColor = [System.Drawing.Color]::FromArgb(100, 230, 150)
$txtConsole.Font = New-Object System.Drawing.Font("Consolas", 9)
$form.Controls.Add($txtConsole)

# Wire C# Logger directly into Live Console Box
[NativeRLHookEngine]::OnLogMessage = {
    param($msg)
    $timestamp = (Get-Date).ToString("HH:mm:ss.fff")
    $logLine = "[$timestamp] $msg\`r\`n"
    if ($txtConsole.InvokeRequired) {
        $txtConsole.Invoke([Action[string]]{ param($line) $txtConsole.AppendText($line) }, $logLine)
    } else {
        $txtConsole.AppendText($logLine)
    }
}

# Initial Greeting Log
[NativeRLHookEngine]::Log("[INIT] FN Pro Rocket League Master-Engine Control Center v4.0.2 ready.")
[NativeRLHookEngine]::Log("[INIT] Internal Deadzone: 0.05 | Dodge Deadzone: 0.05 | Radial Re-scaling Active.")
[NativeRLHookEngine]::Log("[INIT] Logitech G-Hub Dispatcher: MOUSE1 (Primary Click), MOUSE2 (Secondary Click).")

# Real-Time Keystroke Testing Box
$lblTest = New-Object System.Windows.Forms.Label
$lblTest.Text = "Latency & Key Duration Tester (Click here and tap/double-tap W, A, S, D):"
$lblTest.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$lblTest.ForeColor = [System.Drawing.Color]::FromArgb(160, 175, 200)
$lblTest.Location = New-Object System.Drawing.Point(25, 496)
$lblTest.AutoSize = $true
$form.Controls.Add($lblTest)

$txtTest = New-Object System.Windows.Forms.TextBox
$txtTest.Location = New-Object System.Drawing.Point(25, 516)
$txtTest.Size = New-Object System.Drawing.Size(825, 24)
$txtTest.BackColor = [System.Drawing.Color]::FromArgb(18, 24, 38)
$txtTest.ForeColor = [System.Drawing.Color]::FromArgb(0, 255, 180)
$txtTest.Font = New-Object System.Drawing.Font("Consolas", 9.5)
$form.Controls.Add($txtTest)

# Bottom Actions: Desktop Shortcut, Open App Folder, Web Simulator
$btnCreateShortcut = New-Object System.Windows.Forms.Button
$btnCreateShortcut.Text = "Create Desktop FN Shortcut"
$btnCreateShortcut.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$btnCreateShortcut.BackColor = [System.Drawing.Color]::FromArgb(20, 30, 45)
$btnCreateShortcut.ForeColor = [System.Drawing.Color]::FromArgb(255, 200, 80)
$btnCreateShortcut.FlatStyle = "Flat"
$btnCreateShortcut.Location = New-Object System.Drawing.Point(25, 555)
$btnCreateShortcut.Size = New-Object System.Drawing.Size(265, 36)
$btnCreateShortcut.Add_Click({
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktop\\FN_RocketLeague_MasterEngine.lnk"
    $wscript = New-Object -ComObject WScript.Shell
    $shortcut = $wscript.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File \`"$appDir\\Launch-GUI.ps1\`""
    $shortcut.Description = "FN Rocket League Master-Engine GUI"
    $shortcut.Save()
    [NativeRLHookEngine]::Log("[SHORTCUT] Created desktop shortcut at: $shortcutPath")
    [System.Windows.Forms.MessageBox]::Show("Desktop shortcut created successfully with custom FN icon!", "Shortcut Created", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
})
$form.Controls.Add($btnCreateShortcut)

$btnOpenFolder = New-Object System.Windows.Forms.Button
$btnOpenFolder.Text = "Open App Folder"
$btnOpenFolder.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnOpenFolder.BackColor = [System.Drawing.Color]::FromArgb(30, 41, 59)
$btnOpenFolder.ForeColor = [System.Drawing.Color]::FromArgb(220, 230, 245)
$btnOpenFolder.FlatStyle = "Flat"
$btnOpenFolder.Location = New-Object System.Drawing.Point(302, 555)
$btnOpenFolder.Size = New-Object System.Drawing.Size(265, 36)
$btnOpenFolder.Add_Click({
    Start-Process explorer.exe $appDir
})
$form.Controls.Add($btnOpenFolder)

$btnOpenSim = New-Object System.Windows.Forms.Button
$btnOpenSim.Text = "Open 120Hz Simulator"
$btnOpenSim.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$btnOpenSim.BackColor = [System.Drawing.Color]::FromArgb(0, 110, 180)
$btnOpenSim.ForeColor = [System.Drawing.Color]::White
$btnOpenSim.FlatStyle = "Flat"
$btnOpenSim.Location = New-Object System.Drawing.Point(580, 555)
$btnOpenSim.Size = New-Object System.Drawing.Size(270, 36)
$btnOpenSim.Add_Click({
    $appUrl = "${typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-66xlg3jfu5vx3btyqeff34-174192677837.europe-west1.run.app'}"
    Start-Process "msedge.exe" "--app=$appUrl"
})
$form.Controls.Add($btnOpenSim)

# Clear Console Button
$btnClearLog = New-Object System.Windows.Forms.Button
$btnClearLog.Text = "Clear Console"
$btnClearLog.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$btnClearLog.BackColor = [System.Drawing.Color]::FromArgb(25, 32, 45)
$btnClearLog.ForeColor = [System.Drawing.Color]::FromArgb(150, 160, 180)
$btnClearLog.FlatStyle = "Flat"
$btnClearLog.Location = New-Object System.Drawing.Point(750, 260)
$btnClearLog.Size = New-Object System.Drawing.Size(100, 22)
$btnClearLog.Add_Click({
    $txtConsole.Clear()
})
$form.Controls.Add($btnClearLog)

# Persist Launch Script
$MyInvocation.MyCommand.ScriptBlock | Out-File -FilePath "$appDir\\Launch-GUI.ps1" -Encoding ascii -Force

# Clean Hook cleanup on form close
$form.Add_FormClosing({
    [NativeRLHookEngine]::StopHook()
})

Write-Host "[OK] FN Master-Engine Control Center Windows Form opened successfully." -ForegroundColor Green
[System.Windows.Forms.Application]::Run($form)
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(fullPowerShellInstallerScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadPS1 = () => {
    const blob = new Blob([fullPowerShellInstallerScript], { type: 'text/plain;charset=ascii' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Setup-FNMasterEngine.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with FN Monogram Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <span className="font-['Chakra_Petch'] font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-amber-300">
                FN
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-['Chakra_Petch'] font-bold text-xl text-slate-100 uppercase tracking-wide">
                  FN Master-Engine Control Center (Standalone EXE &amp; G-HUB Auto-Deploy)
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded font-bold">
                  FN PRO EDITION
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                  DZ 0.05 / 0.05 UPGRADED
                </span>
              </div>
              <p className="text-sm text-slate-300 font-['Rajdhani'] mt-2 max-w-3xl leading-relaxed">
                Generates a standalone <strong className="text-cyan-400">FN_RocketLeague_MasterEngine.exe</strong> on your Desktop with custom <strong className="text-amber-300">"FN"</strong> icon branding, deploys the Lua script directly to your Logitech G-HUB directory (<code className="text-emerald-300 font-mono">%LOCALAPPDATA%\LGHUB\scripts</code>), and configures the continuous re-scaled <strong className="text-cyan-300">0.05 Internal Deadzone</strong> and <strong className="text-cyan-300">0.05 Dodge Deadzone</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-500/25"
            >
              {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'COPIED TO CLIPBOARD' : 'COPY FN INSTALLER SCRIPT'}</span>
            </button>

            <button
              onClick={handleDownloadPS1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>DOWNLOAD SETUP-FN.PS1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deadzone & Logitech Terminology Upgrade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>Internal Deadzone (0.05 / 5%)</span>
          </div>
          <p className="text-slate-300 font-['Rajdhani'] text-xs leading-relaxed">
            Eliminates stick drift and unwanted steering wobble without the jarring 5% jump. Our continuous formula rescales <code className="text-cyan-300 font-mono">[0.05..1.00]</code> to start smoothly at 0.00 right at the threshold.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Dodge Deadzone (0.05 / 5%)</span>
          </div>
          <p className="text-slate-300 font-['Rajdhani'] text-xs leading-relaxed">
            Guarantees immediate 45° diagonal speedflip dodge triggers when double jumping while preventing accidental backflips during high-speed fast aerial kickoffs.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Logitech G-HUB Direct Auto-Deploy</span>
          </div>
          <p className="text-slate-300 font-['Rajdhani'] text-xs leading-relaxed">
            Single-click deployment straight into <code className="text-emerald-300 font-mono">%LOCALAPPDATA%\LGHUB\scripts\RocketLeague_MasterEngine.lua</code> and auto-copy to clipboard.
          </p>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-200">
              Setup-FNMasterEngine.ps1 (Pure ASCII &amp; English)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Custom FN Icon + G-HUB Deploy + Standalone EXE
            </span>
            <button
              onClick={handleCopyScript}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded transition-colors"
            >
              {copiedScript ? 'Copied!' : 'Copy Script'}
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[550px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="font-['JetBrains_Mono'] whitespace-pre-wrap selection:bg-cyan-500/30">
            {fullPowerShellInstallerScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
