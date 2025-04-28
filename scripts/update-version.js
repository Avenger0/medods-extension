// scripts/update-version.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, "../package.json");
const versionJsPath = path.resolve(__dirname, "../src/utils/version.js");
const manifestPath = path.resolve(__dirname, "../public/manifest.json");

try {
    // Проверка существования файлов
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`Файл package.json не найден: ${packageJsonPath}`);
    }

    if (!fs.existsSync(versionJsPath)) {
        throw new Error(`Файл version.js не найден: ${versionJsPath}`);
    }

    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Файл manifest.json не найден: ${manifestPath}`);
    }

    // Читаем текущий package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const version = packageJson.version;

    console.log(`Текущая версия в package.json: ${version}`);
    console.log(`Путь к манифесту: ${manifestPath}`);

    // Обновляем version.js
    let versionJsContent = fs.readFileSync(versionJsPath, "utf8");
    versionJsContent = versionJsContent.replace(
        /version: ['"].*['"]/,
        `version: '${version}'`
    );
    fs.writeFileSync(versionJsPath, versionJsContent);
    console.log(`✅ Версия в version.js обновлена до ${version}`);

    // Обновляем manifest.json
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        console.log(`Текущая версия в manifest.json: ${manifest.version}`);

        manifest.version = version;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`✅ Версия в manifest.json обновлена до ${version}`);
    } catch (manifestError) {
        console.error(`❌ Ошибка при обновлении manifest.json:`, manifestError);
        throw manifestError;
    }
} catch (error) {
    console.error("❌ Ошибка при обновлении версии:", error);
    process.exit(1);
}
