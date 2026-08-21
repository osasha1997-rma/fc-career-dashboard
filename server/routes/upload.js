import { Router } from "express";
import crypto from "crypto";

const router = Router();

const CLOUD  = process.env.CLOUDINARY_CLOUD;
const KEY    = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

// POST /api/upload/photo — receives base64 data URI, uploads to Cloudinary, returns URL
router.post("/photo", async (req, res) => {
    try {
        const { dataUri, publicId } = req.body;
        if (!dataUri) return res.status(400).json({ error: "No dataUri provided" });

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const pid = publicId ?? `careeros_${timestamp}`;
        const params = `public_id=${pid}&timestamp=${timestamp}`;
        const signature = crypto.createHash("sha256")
            .update(params + SECRET)
            .digest("hex");

        const fd = new FormData();
        fd.set("file", dataUri);
        fd.set("public_id", pid);
        fd.set("timestamp", timestamp);
        fd.set("api_key", KEY);
        fd.set("signature", signature);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
            method: "POST", body: fd,
        });
        const data = await cloudRes.json();
        if (!cloudRes.ok) return res.status(500).json({ error: data.error?.message ?? "Upload failed" });

        res.json({ url: data.secure_url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
