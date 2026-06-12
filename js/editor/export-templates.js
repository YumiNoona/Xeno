window.XenoExportTemplates = (function() {
  'use strict';

  function getReadme() {
    return '------------THANK YOU FOR CHOOSING-------------\n' +
      '----------------XENO 360\u00B0 TOUR----------------\n' +
      '\n' +
      'Thank you for choosing Xeno 360\u00B0 Tour.\n' +
      '\n' +
      'This package contains your exported virtual tour and everything required\n' +
      'to run it locally on your device.\n' +
      '\n' +
      '--------------VIEWING YOUR TOUR---------------\n' +
      '\n' +
      'Windows\n' +
      '\u2022 Double-click run.bat\n' +
      '\n' +
      'macOS / Linux\n' +
      '\u2022 Double-click run.sh\n' +
      '\u2022 Or run: bash run.sh\n' +
      '\n' +
      'The launch script will automatically:\n' +
      '\n' +
      '\u2022 Detect Python or Node.js on your system\n' +
      '\u2022 Start a local web server\n' +
      '\u2022 Open the tour in your default browser\n' +
      '\n' +
      'If neither Python nor Node.js is installed, you\u2019ll be guided through\n' +
      'the installation process with minimal setup required.\n' +
      '\n' +
      '-----------------LOCAL ACCESS-----------------\n' +
      '\n' +
      'Once started, your tour will be available at:\n' +
      '\n' +
      'http://localhost:8080\n' +
      '\n' +
      'Note: The exported tour runs independently from the Xeno editor\n' +
      'environment.\n' +
      '\n' +
      '----------------MANUAL STARTUP----------------\n' +
      '\n' +
      'If the launcher script does not work, open a terminal in this folder\n' +
      'and run:\n' +
      '\n' +
      'python -m http.server 8080\n' +
      '\n' +
      'Then open:\n' +
      '\n' +
      'http://localhost:8080\n' +
      '\n' +
      '---\n' +
      '\n' +
      'Made with \u2665 by Veil\n';
  }

  function getBat() {
    return '@echo off\r\n' +
      'setlocal enabledelayedexpansion\r\n' +
      'title Xeno Tour\r\n' +
      'set PORT=8080\r\n' +
      '\r\n' +
      'python --version >nul 2>&1\r\n' +
      'if !errorlevel! equ 0 (\r\n' +
      '  start http://localhost:%PORT%\r\n' +
      '  python -m http.server %PORT%\r\n' +
      '  exit /b\r\n' +
      ')\r\n' +
      '\r\n' +
      'node --version >nul 2>&1\r\n' +
      'if !errorlevel! equ 0 (\r\n' +
      '  start http://localhost:%PORT%\r\n' +
      '  npx serve -p %PORT% -s\r\n' +
      '  exit /b\r\n' +
      ')\r\n' +
      '\r\n' +
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "& {$w=New-Object -ComObject WScript.Shell;$ask=$w.Popup(\'Xeno Tour needs Python or Node.js.\'+[char]10+\'Which one do you want to install?\',0,\'Xeno Tour\',3+32);if($ask -eq 6){$w.Popup(\'Downloading Python...\',1,\'Xeno Tour\',0+64);try{$wc=New-Object System.Net.WebClient;$py=Join-Path $env:TEMP \'python-installer.exe\';$wc.DownloadFile(\'https://www.python.org/ftp/python/3.13.3/python-3.13.3-amd64.exe\',$py);Start-Process -Wait -FilePath $py -ArgumentList \'/quiet InstallAllUsers=1 PrependPath=1\';Start-Process cmd -ArgumentList \'/c start http://localhost:%PORT% && python -m http.server %PORT%\';$w.Popup(\'Python installed! Tour starting in new window.\',0,\'Xeno Tour\',0+64)}catch{$w.Popup(\'Failed to install Python.\',0,\'Xeno Tour\',0+16)}}elseif($ask -eq 7){$w.Popup(\'Downloading Node.js...\',1,\'Xeno Tour\',0+64);try{$wc=New-Object System.Net.WebClient;$nj=Join-Path $env:TEMP \'node-installer.msi\';$wc.DownloadFile(\'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi\',$nj);Start-Process -Wait -FilePath $nj -ArgumentList \'/quiet\';Start-Process cmd -ArgumentList \'/c start http://localhost:%PORT% && npx serve -p %PORT% -s\';$w.Popup(\'Node.js installed! Tour starting in new window.\',0,\'Xeno Tour\',0+64)}catch{$w.Popup(\'Failed to install Node.js.\',0,\'Xeno Tour\',0+16)}}else{$w.Popup(\'Please install Python or Node.js manually and run this script again.\',0,\'Xeno Tour\',0+48)}}"\r\n';
  }

  function getSh() {
    return '#!/bin/bash\n' +
      'PORT=8080\n' +
      '\n' +
      'open_url() {\n' +
      '  xdg-open "$1" 2>/dev/null || open "$1" 2>/dev/null || true\n' +
      '}\n' +
      '\n' +
      '# --- Check for Python ---\n' +
      'if command -v python3 &>/dev/null; then\n' +
      '  open_url "http://localhost:$PORT"\n' +
      '  python3 -m http.server $PORT\n' +
      '  exit 0\n' +
      'fi\n' +
      'if command -v python &>/dev/null; then\n' +
      '  open_url "http://localhost:$PORT"\n' +
      '  python -m http.server $PORT\n' +
      '  exit 0\n' +
      'fi\n' +
      '\n' +
      '# --- Check for Node.js ---\n' +
      'if command -v node &>/dev/null; then\n' +
      '  open_url "http://localhost:$PORT"\n' +
      '  npx serve -p $PORT -s\n' +
      '  exit 0\n' +
      'fi\n' +
      '\n' +
      '# --- macOS GUI ---\n' +
      'if [ "$(uname)" = "Darwin" ]; then\n' +
      '  ans=$(osascript -e ' + "'" + 'button returned of (display dialog "Xeno Tour needs Python or Node.js." + (ASCII character 10) + "Select one to download and install:" buttons {"Cancel","Node.js","Python"} default button "Python" with icon note)' + "'" + ' 2>/dev/null)\n' +
      '  if [ "$ans" = "Python" ]; then\n' +
      '    if command -v brew &>/dev/null; then\n' +
      '      brew install python && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
      '    fi\n' +
      '    open_url "https://www.python.org/downloads/"\n' +
      '    osascript -e ' + "'" + 'display dialog "Python website opened. Download and install Python, then run this script again." buttons {"OK"} default button "OK" with icon note' + "'" + ' 2>/dev/null\n' +
      '    exit 1\n' +
      '  elif [ "$ans" = "Node.js" ]; then\n' +
      '    if command -v brew &>/dev/null; then\n' +
      '      brew install node && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
      '    fi\n' +
      '    open_url "https://nodejs.org/"\n' +
      '    osascript -e ' + "'" + 'display dialog "Node.js website opened. Download and install Node.js, then run this script again." buttons {"OK"} default button "OK" with icon note' + "'" + ' 2>/dev/null\n' +
      '    exit 1\n' +
      '  else\n' +
      '    osascript -e ' + "'" + 'display dialog "Please install Python or Node.js to run this tour." buttons {"OK"} default button "OK" with icon stop' + "'" + ' 2>/dev/null\n' +
      '    exit 1\n' +
      '  fi\n' +
      'fi\n' +
      '\n' +
      '# --- Linux GUI (zenity) ---\n' +
      'if command -v zenity &>/dev/null; then\n' +
      '  ans=$(zenity --list --title="Xeno Tour" --text="Select what to install:" --radiolist --column="" --column="Option" TRUE "Python" FALSE "Node.js" --height=200 2>/dev/null)\n' +
      '  if [ "$ans" = "Python" ]; then\n' +
      '    if command -v apt &>/dev/null; then\n' +
      '      sudo apt update -qq && sudo apt install -y -qq python3 && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
      '    elif command -v dnf &>/dev/null; then\n' +
      '      sudo dnf install -y -q python3 && open_url "http://localhost:$PORT" && python3 -m http.server $PORT && exit 0\n' +
      '    else\n' +
      '      zenity --error --text="No supported package manager found.\\nInstall Python from python.org" 2>/dev/null\n' +
      '      exit 1\n' +
      '    fi\n' +
      '  elif [ "$ans" = "Node.js" ]; then\n' +
      '    if command -v apt &>/dev/null; then\n' +
      '      sudo apt update -qq && sudo apt install -y -qq nodejs npm && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
      '    elif command -v dnf &>/dev/null; then\n' +
      '      sudo dnf install -y -q nodejs && open_url "http://localhost:$PORT" && npx serve -p $PORT -s && exit 0\n' +
      '    else\n' +
      '      zenity --error --text="No supported package manager found.\\nInstall Node.js from nodejs.org" 2>/dev/null\n' +
      '      exit 1\n' +
      '    fi\n' +
      '  else\n' +
      '    zenity --info --text="Please install Python or Node.js to run this tour." 2>/dev/null\n' +
      '    exit 1\n' +
      '  fi\n' +
      'fi\n' +
      '\n' +
      '# --- Terminal fallback ---\n' +
      'echo ""\n' +
      'echo "  Xeno Tour"\n' +
      'echo "  ----------"\n' +
      'echo "  Python or Node.js is required to run the tour."\n' +
      'echo "  Install one and run this script again."\n' +
      'echo "  https://www.python.org/downloads/"\n' +
      'echo "  https://nodejs.org/"\n' +
      'echo ""\n';
  }

  return { getReadme: getReadme, getBat: getBat, getSh: getSh };
})();
