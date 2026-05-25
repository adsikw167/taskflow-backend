require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/Project');

const cleanupNullMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const projects = await Project.find({});
    let totalCleaned = 0;

    for (const project of projects) {
      const originalCount = project.members.length;
      
      // Remove members with null user references
      project.members = project.members.filter(m => m.user != null);
      
      const cleanedCount = originalCount - project.members.length;
      
      if (cleanedCount > 0) {
        await project.save();
        console.log(`Project "${project.name}": Removed ${cleanedCount} null member(s)`);
        totalCleaned += cleanedCount;
      }
    }

    console.log(`\n✓ Cleanup complete! Removed ${totalCleaned} null member reference(s) from ${projects.length} project(s)`);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
};

cleanupNullMembers();
