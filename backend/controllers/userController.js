const User = require("../models/User")

exports.searchUsers = async (req, res) => {
    try {
        const query = (req.query.q || "").trim()

        const filter = query
            ? {
                  _id: { $ne: req.user._id },
                  $or: [
                      { name: { $regex: query, $options: "i" } },
                      { email: { $regex: query, $options: "i" } }
                  ]
              }
            : { _id: { $ne: req.user._id } }

        const users = await User.find(filter)
            .select("name email avatar")
            .sort({ name: 1 })
            .limit(12)

        res.json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
