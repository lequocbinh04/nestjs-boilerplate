// import { RoleName } from 'src/common/constants/role.constant';
// import { PrismaService } from 'src/shared/database/prisma.service';

// const prisma = new PrismaService();
// const main = async () => {
//   const roleCount = await prisma.role.count();
//   if (roleCount > 0) {
//     throw new Error('Roles already exist');
//   }
//   const roles = await prisma.role.createMany({
//     data: [
//       {
//         name: RoleName.Admin,
//         description: 'Admin role',
//       },
//       {
//         name: RoleName.Client,
//         description: 'Client role',
//       },
//     ],
//   });

//   // const adminRole = await prisma.role.findFirstOrThrow({
//   //   where: {
//   //     name: RoleName.Admin,
//   //   },
//   // });
//   // const hashedPassword = await hashingService.hash(process.env.ADMIN_PASSWORD);
//   // const adminUser = await prisma.user.create({
//   //   data: {
//   //     email: process.env.ADMIN_EMAIL,
//   //     password: hashedPassword,
//   //     name: process.env.ADMIN_NAME,
//   //     phoneNumber: process.env.ADMIN_PHONE_NUMBER,
//   //     roleId: adminRole.id,
//   //   },
//   // });
//   return {
//     createdRoleCount: roles.count,
//   };
// };

// main()
//   .then(({ createdRoleCount }) => {
//     // console.log(`Created admin user: ${adminUser.email}`);
//   })
//   .catch(console.error);
