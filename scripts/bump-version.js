// scripts/bump-version.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, "../package.json");

// Генерируем новую версию в формате YYYY.MM.DD
function generateNewVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}`;
}

// Проверяем формат версии (YYYY.MM.DD)
function isValidVersionFormat(version) {
    return /^\d{4}\.\d{2}\.\d{2}$/.test(version);
}

try {
    // Читаем текущий package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const currentVersion = packageJson.version;

    // Получаем новую версию: либо из аргументов командной строки, либо генерируем автоматически
    let newVersion;

    // Аргументы командной строки (пропускаем первые два - node и имя файла)
    const args = process.argv.slice(2);
    if (args.length > 0) {
        newVersion = args[0];

        // Проверяем формат версии
        if (!isValidVersionFormat(newVersion)) {
            console.error(
                "❌ Неверный формат версии. Используйте формат YYYY.MM.DD"
            );
            process.exit(1);
        }
    } else {
        // Если версия не указана, генерируем автоматически
        newVersion = generateNewVersion();
    }

    console.log(`Обновление версии: ${currentVersion} -> ${newVersion}`);

    // Обновляем версию
    packageJson.version = newVersion;

    // Записываем обновленный package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log(`✅ Версия в package.json обновлена до ${newVersion}`);

    // Запускаем скрипт обновления версии в других файлах
    execSync("node scripts/update-version.js", { stdio: "inherit" });
} catch (error) {
    console.error("❌ Ошибка при обновлении версии:", error);
    process.exit(1);
}
