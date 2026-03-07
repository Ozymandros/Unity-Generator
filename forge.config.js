/**
 * Electron Forge Configuration
 * 
 * Configures packaging, signing, and distribution for Windows, macOS, and Linux.
 * 
 * @fileoverview This configuration handles:
 * - ASAR packaging for code bundling
 * - Application icon configuration
 * - Python backend as extra resource
 * - Platform-specific settings for Windows, macOS, and Linux
 * - File associations for each platform
 * - URL scheme registration for deep linking
 * - Installer configuration for all platforms
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    /**
     * Enable ASAR packaging to bundle application code
     * @type {boolean}
     */
    asar: true,
    
    /**
     * Use locally installed Electron instead of downloading
     * @type {string}
     */
    electronVersion: packageJson.devDependencies.electron.replace('^', ''),
    
    /**
     * Application icon path (without extension, platform-specific extensions will be used)
     * @type {string}
     */
    icon: './app-icon',
    
    /**
     * Extra resources to include in the packaged application
     * Includes Python backend executable only
     * @type {string[]}
     */
    extraResource: [
      './backend/dist/unity-generator-backend.exe'
    ],
    
    /**
     * Files and directories to exclude from packaging
     * Reduces package size and excludes development files
     * @type {string[]}
     */
    ignore: [
      '/node_modules',
      '/frontend',
      '/.git',
      '/.github',
      '/.vscode',
      '/docs',
      '/test*',
      '/temp*',
      '/logs',
      '/db',
      '/config',
      '/scripts',
      '/services',
      '/output',
      '/.kiro',
      '/.cursor',
      '/.qwen',
      '/.agent',
      '/.agents',
      '/Unity-Generator.git',
      '/.dockerignore',
      '/.gitignore',
      '/README.md',
      '/CONTRIBUTING.md',
      '/copilot-instructions.md',
      '/pyrightconfig.json',
      '/pnpm-lock.yaml',
      '/pnpm-workspace.yaml',
      '/docker-compose.yml',
      '/check_all_output*.txt',
      '/backend_test_output*.txt',
      '/backend_test_failure*.txt',
      '/frontend_typecheck_output*.txt',
      '/full_test_output*.txt',
      '/test_output*.txt',
      '/test_results*.txt',
      '/typecheck_output*.txt',
      '/repro_failure.py',
      '/skills-lock.json',
      '/mcp_pkg_inspect.txt',
      '/.mypy_cache',
      '/.pytest_cache',
      '/.ruff_cache',
      '/.devcontainer',
      '/.claude',
      '/backend/app',
      '/backend/agents',
      '/backend/tests',
      '/backend/node_modules',
      '/backend/__pycache__',
      '/backend/.pytest_cache',
      '/backend/.mypy_cache',
      '/backend/.ruff_cache',
      '/backend/*.py',
      '/backend/*.txt',
      '/vite.*.config.mjs',
      '/forge.config.js',
      '/.npmrc',
      '/app-icon-*.png'
    ],
    
    /**
     * Auto-update configuration
     * @type {object}
     */
    autoUpdate: {
      /**
       * Enable auto-updates
       * @type {boolean}
       */
      enabled: true,
      /**
       * Update server URL
       * @type {string}
       */
      url: process.env.UPDATE_SERVER_URL || 'https://updates.unitygenerator.com',
      /**
       * Platform-specific update mechanisms
       * @type {object}
       */
      platform: {
        /**
         * Windows update mechanism (Squirrel)
         * @type {string}
         */
        win32: 'squirrel',
        /**
         * macOS update mechanism (zip)
         * @type {string}
         */
        darwin: 'zip',
        /**
         * Linux update mechanism (AppImage)
         * @type {string}
         */
        linux: 'appimage'
      }
    },
    
    /**
     * Windows-specific configuration
     * @type {object}
     */
    ...(process.platform === 'win32' && {
      win32Metadata: {
        CompanyName: 'Unity Generator',
        FileDescription: 'Unity Asset Generator',
        OriginalFilename: 'unity-generator.exe',
        ProductName: 'Unity Generator',
        InternalName: 'unity-generator'
      },
      /**
       * File associations for Windows
       * Registers custom file types with the application
       * @type {object}
       */
      fileAssociations: [
        {
          ext: 'unity',
          name: 'Unity Project',
          description: 'Unity Project File',
          icon: './app-icon.ico'
        }
      ],
      /**
       * URL scheme registration for Windows
       * Registers custom protocol handler
       * @type {object}
       */
      protocols: [
        {
          name: 'Unity Generator',
          schemes: ['unitygen']
        }
      ]
    }),
    
    /**
     * macOS-specific configuration
     * @type {object}
     */
    ...(process.platform === 'darwin' && {
      osxSign: {
        identity: 'Developer ID Application',
        options: {
          'time': true,
          'hardened-runtime': true,
          'entitlements': 'entitlements.plist',
          'entitlements-inherit': 'entitlements.plist'
        }
      },
      osxNotarize: {
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
        teamId: process.env.APPLE_TEAM_ID
      },
      /**
       * File associations for macOS
       * Registers custom file types with the application
       * @type {object}
       */
      fileAssociations: [
        {
          ext: 'unity',
          name: 'Unity Project',
          description: 'Unity Project File',
          icon: './app-icon.icns'
        }
      ],
      /**
       * URL scheme registration for macOS
       * Registers custom protocol handler
       * @type {object}
       */
      protocols: [
        {
          name: 'Unity Generator',
          schemes: ['unitygen']
        }
      ]
    }),
    
    /**
     * Linux-specific configuration
     * @type {object}
     */
    ...(process.platform === 'linux' && {
      /**
       * File associations for Linux
       * Registers custom file types with the application
       * @type {object}
       */
      fileAssociations: [
        {
          ext: 'unity',
          name: 'Unity Project',
          description: 'Unity Project File',
          icon: './app-icon.png'
        }
      ],
      /**
       * URL scheme registration for Linux
       * Registers custom protocol handler
       * @type {object}
       */
      protocols: [
        {
          name: 'Unity Generator',
          schemes: ['unitygen']
        }
      ]
    })
  },
  rebuildConfig: {},
  makers: [
    /**
     * Windows Squirrel maker with MSI installer support
     * @type {object}
     */
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'unity_generator',
        authors: 'Unity Generator Team',
        icon: './app-icon.ico',
        setupExe: 'UnityGeneratorSetup.exe',
        setupIcon: './app-icon.ico',
        loadingGif: './app-icon.ico',
        certificateFile: process.env.WIN_CERT_FILE,
        certificatePassword: process.env.WIN_CERT_PASSWORD,
        signWithParams: '/a /tr http://timestamp.digicert.com /td sha256 /fd sha256',
        /**
         * File associations for Windows installer
         * @type {string[]}
         */
        fileAssociations: ['unity'],
        /**
         * URL scheme registration for Windows
         * @type {string}
         */
        protocol: {
          name: 'unitygen',
          schemes: ['unitygen']
        }
      }
    },
    /**
     * macOS DMG maker with notarization support
     * @type {object}
     */
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: './app-icon.icns',
        format: 'ULFO',
        background: './app-icon.png',
        window: {
          width: 540,
          height: 380
        },
        contents: [
          { x: 410, y: 230, type: 'link', path: '/Applications' },
          { x: 130, y: 230, type: 'file' }
        ],
        /**
         * File associations for macOS DMG
         * @type {string[]}
         */
        fileAssociations: ['unity'],
        /**
         * URL scheme registration for macOS
         * @type {string}
         */
        protocol: 'unitygen'
      }
    },
    /**
     * Linux DEB maker with AppImage support
     * @type {object}
     */
    {
      name: '@electron-forge/maker-deb',
      config: {
        name: 'unity-generator',
        icon: './app-icon.png',
        section: 'utils',
        priority: 'optional',
        depends: ['libgtk-3-0', 'libnotify4', 'libnss3', 'libxss1', 'libxtst6', 'libxkbfile1', 'libsecret-1-0', 'libatspi2.0-0'],
        categories: ['Utility'],
        /**
         * File associations for Linux DEB
         * @type {string[]}
         */
        fileAssociations: ['unity'],
        /**
         * URL scheme registration for Linux
         * @type {string}
         */
        protocol: 'unitygen',
        /**
         * AppImage configuration
         * @type {object}
         */
        appImage: {
          name: 'UnityGenerator',
          icon: './app-icon.png',
          fileAssociations: ['unity'],
          protocol: 'unitygen'
        }
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'your-username',
          name: 'unity-generator'
        },
        prerelease: false,
        /**
         * Auto-update configuration
         * @type {object}
         */
        publishAutoUpdate: true
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        build: [
          {
            entry: 'main.js',
            config: 'vite.main.config.mjs',
          },
          {
            entry: 'preload.js',
            config: 'vite.preload.config.mjs',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    }
  ]
};

export default config;
