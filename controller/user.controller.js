export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Adjust fields based on what your frontend sends
    const { name, bio, location } = req.body;

    const updatedUser = await UserSchema.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(location && { location }),
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
