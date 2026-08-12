import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        VitePWA({
            registerType: "autoUpdate",

            manifest: {
                name: "Mi Calendario",
                short_name: "Calendario",
                description: "Calendario personal para organizar mis tareas",
                theme_color: "#222222",
                background_color: "#f5f5f5",
                display: "standalone",
                orientation: "portrait",

                icons: [
                    {
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            }
        })
    ]
});