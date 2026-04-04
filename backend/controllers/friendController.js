const FriendRequest = require("../models/FriendRequest")

const populateRequest = (query) =>
    query
        .populate("requester", "name email avatar")
        .populate("recipient", "name email avatar")

const getFriendFromRequest = (request, userId) => {
    const isRequester = request.requester._id.toString() === userId.toString()
    return isRequester ? request.recipient : request.requester
}

exports.getFriendSummary = async (req, res) => {
    try {
        const userId = req.user._id

        const [incoming, outgoing, accepted] = await Promise.all([
            populateRequest(
                FriendRequest.find({
                    recipient: userId,
                    status: "pending"
                }).sort({ createdAt: -1 })
            ),
            populateRequest(
                FriendRequest.find({
                    requester: userId,
                    status: "pending"
                }).sort({ createdAt: -1 })
            ),
            populateRequest(
                FriendRequest.find({
                    status: "accepted",
                    $or: [{ requester: userId }, { recipient: userId }]
                }).sort({ updatedAt: -1 })
            )
        ])

        res.json({
            incoming,
            outgoing,
            friends: accepted.map((request) => ({
                _id: request._id,
                friend: getFriendFromRequest(request, userId)
            }))
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body

        if (!recipientId || recipientId === req.user._id.toString()) {
            return res.status(400).json({ message: "Invalid recipient" })
        }

        const existing = await FriendRequest.findOne({
            $or: [
                { requester: req.user._id, recipient: recipientId },
                { requester: recipientId, recipient: req.user._id }
            ]
        })

        if (existing) {
            if (existing.status === "rejected") {
                existing.requester = req.user._id
                existing.recipient = recipientId
                existing.status = "pending"
                await existing.save()

                const refreshed = await populateRequest(FriendRequest.findById(existing._id))
                return res.status(201).json(refreshed)
            }

            return res.status(400).json({ message: "Friend request already exists" })
        }

        const request = await FriendRequest.create({
            requester: req.user._id,
            recipient: recipientId
        })

        const populated = await populateRequest(FriendRequest.findById(request._id))

        res.status(201).json(populated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params

        const request = await FriendRequest.findOne({
            _id: requestId,
            recipient: req.user._id,
            status: "pending"
        })

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" })
        }

        request.status = "accepted"
        await request.save()

        const populated = await populateRequest(FriendRequest.findById(request._id))
        res.json(populated)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params

        const request = await FriendRequest.findOne({
            _id: requestId,
            recipient: req.user._id,
            status: "pending"
        })

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" })
        }

        request.status = "rejected"
        await request.save()

        res.json({ message: "Friend request rejected" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
