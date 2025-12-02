import { AppDataSource } from "../data-source";
import { Role } from "../entity/Role";
import { User } from "../entity/User";
import { RoleName } from "../types/RoleName";

export const seedDatabase = async () => {
  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);

    let adminRole = await roleRepository.findOneBy({ name: RoleName.ADMIN });
    if (!adminRole) {
      adminRole = new Role();
      adminRole.name = RoleName.ADMIN;
      await roleRepository.save(adminRole);
    }

    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL;
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn(
        "❌ -Admin default credentials are not set in environment variables."
      );
      return;
    }
    const existingAdmin = await userRepository.findOneBy({ email: adminEmail });
    if (!existingAdmin) {
      console.log("ℹ️ - Creating default admin user...");
      const adminUser = new User();
      adminUser.email = adminEmail;
      adminUser.password = adminPassword;
      adminUser.roleID = adminRole;
      adminUser.firstname = "Admin";
      adminUser.surname = "User";
      await userRepository.save(adminUser);
      console.log("✅ - Admin User Created Successfully.");
    } else {
      console.log("✅ - Admin user already exists. Skipping creation.");
    }
  } catch (error) {
    console.error("❌ - Error seeding database:", error);
  }
};
