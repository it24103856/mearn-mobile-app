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
    console.log('🔐 Checking admin access for user:', req.user);
    if (req.user && req.user.isAdmin === true) {
        console.log('✅ Admin access granted');
        next();
    } else {
        console.log('❌ Admin access denied - user is not admin');
        res.status(403).json({ message: "You are not an admin! Access denied.", success: false });
    }
};