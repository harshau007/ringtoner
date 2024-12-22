import * as vercel from "@vercel/blob";
import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  try {
    const blobUrl = process.env.BLOB_URL;
    if (!blobUrl) {
      throw new Error("BLOB_URL is not defined in environment variables.");
    }

    const downloadURL = await vercel.getDownloadUrl(blobUrl);
    console.log("Download URL:", downloadURL);

    const response = await fetch(downloadURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    const fileName = "cookies.json";
    const filePath = path.join(process.cwd(), fileName);

    fs.writeFileSync(filePath, Buffer.from(buffer));

    console.log("File saved successfully:", filePath);
    return NextResponse.json(true);
  } catch (error) {
    console.log(error);
    return NextResponse.json(false);
  }
}
