#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            let sidecar = tauri::api::process::Command::new_sidecar("unity-generator-backend")
                .map_err(|error| format!("Failed to init backend sidecar: {error}"))?;
            let (mut rx, _child) = sidecar
                .spawn()
                .map_err(|error| format!("Failed to spawn backend sidecar: {error}"))?;

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let tauri::api::process::CommandEvent::Error(error) = event {
                        eprintln!("Backend sidecar error: {error}");
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
