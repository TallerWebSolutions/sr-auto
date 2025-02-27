/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removendo o redirecionamento para localhost, pois agora usamos diretamente o Hasura
  // async rewrites() {
  //   return [
  //     {
  //       source: '/graphql',
  //       destination: 'http://localhost:3000/graphql'
  //     },
  //   ];
  // },
};

module.exports = nextConfig; 