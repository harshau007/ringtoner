/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BLOB_URL: process.env.BLOB_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  },
};

export default nextConfig;
