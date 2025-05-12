import "dotenv/config";
import { PasswordHandler } from "./PasswordHandler";

const TEST_PASSWORD = "password123"

const { hashedPassword, salt } = PasswordHandler.hashPassword(TEST_PASSWORD);
console.log("Hashed Password:", hashedPassword);
console.log("Salt:", salt);

console.log("Correct password verified:", PasswordHandler.verifyPassword(TEST_PASSWORD, hashedPassword, salt))