import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    const authHeader=req.headers.authorization;

    //cheack headrer have token or not
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message:"Unauthorized"})
    }

    const token=authHeader.split(" ")[1];

    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();

    } catch (error) {
        return res.status(401).json({message:"Invalid token"})

    }
}

export const isAdmin = (req, res, next) => {
    // Check if isAdmin is true in req.user
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ message: "ඔබ Admin කෙනෙකු නොවේ! ප්‍රවේශය තහනම්." });
    }
};