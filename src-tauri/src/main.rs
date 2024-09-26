use std::io::{self, Write, Read};
use std::sync::{Arc, Mutex};
use tauri::Manager;
use serde_json::Value;

fn write_message(message: &str) -> io::Result<()> {
    let length = message.len() as u32;
    let length_bytes = length.to_ne_bytes();
    
    io::stdout().write_all(&length_bytes)?;
    io::stdout().write_all(message.as_bytes())?;
    io::stdout().flush()?;
    
    Ok(())
}

fn read_message() -> io::Result<String> {
    let mut length_bytes = [0; 4];
    io::stdin().read_exact(&mut length_bytes)?;
    let length = u32::from_ne_bytes(length_bytes) as usize;
    
    let mut buffer = vec![0; length];
    io::stdin().read_exact(&mut buffer)?;
    
    let message = String::from_utf8(buffer).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
    Ok(message)
}

#[tauri::command]
fn send_test_input(app_handle: tauri::AppHandle, input: String) {
    app_handle.emit_all("stdin-input", input).unwrap();
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn send_response(response: String) -> Result<(), String> {
    write_message(&response).map_err(|e| e.to_string())
}

fn main() {
    let stdout_mutex = Arc::new(Mutex::new(()));

    tauri::Builder::default()
        .setup(move |app| {
            let app_handle = app.handle();
            let _stdout_mutex = Arc::clone(&stdout_mutex);

            std::thread::spawn(move || {
                loop {
                    match read_message() {
                        Ok(message) => {
                            let json: Value = serde_json::from_str(&message).unwrap();
                            // Handle the JSON message here
                            // For example, you can emit an event to the Tauri frontend
                            app_handle.emit_all("native-message", json).unwrap();
                        }
                        Err(e) => {
                            eprintln!("Failed to read message: {}", e);
                            break;
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![send_test_input, greet, send_response])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}