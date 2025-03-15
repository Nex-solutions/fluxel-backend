const { Notes } = require('../model/notes'); 

// Create a new note
const CreateNote = async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }
    // Assume req.admin is set by your authentication middleware
    const admin = req.admin;
    const newNote = new Notes({ admin: admin, note });
    await newNote.save();
    return res.status(201).json({ success: true, message: "Note created successfully", data: newNote });
  } catch (error) {
    console.error("Error creating note:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Retrieve all notes for the authenticated admin
const GetAllNotes = async (req, res) => {
  try {
    const admin = req.admin;
    const notes = await Notes.find({ admin: admin._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, message: "Notes retrieved successfully", data: notes });
  } catch (error) {
    console.error("Error retrieving notes:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Retrieve a single note by its id for the authenticated admin
const GetNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin;
    const note = await Notes.findOne({ _id: id, admin: admin._id });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    return res.status(200).json({ success: true, message: "Note retrieved successfully", data: note });
  } catch (error) {
    console.error("Error retrieving note:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a note by its id for the authenticated admin
const UpdateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }
    const admin = req.admin;
    const updatedNote = await Notes.findOneAndUpdate(
      { _id: id, admin: admin._id },
      { note, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updatedNote) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    return res.status(200).json({ success: true, message: "Note updated successfully", data: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a note by its id for the authenticated admin
const DeleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin;
    const deletedNote = await Notes.findOneAndDelete({ _id: id, admin: admin._id });
    if (!deletedNote) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    return res.status(200).json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { CreateNote, GetAllNotes, GetNoteById, UpdateNote, DeleteNote };
