
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Remove unresolved tauri::process import. Use std::process if needed.

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // If you need to run a process, use std::process or Tauri commands.
            // Example: let output = std::process::Command::new("unity-generator-backend").output();

            // Remove sidecar logic for now, or replace with correct Tauri API if needed.

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}