const prisma = require('../utils/db');

// Create Group
async function createGroup(req, res) {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    // Use Prisma transaction to create group AND add creator as first member
    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          createdById: userId
        }
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: userId
        }
      });

      return group;
    });

    return res.status(201).json({
      message: 'Group created successfully!',
      group: newGroup
    });
  } catch (err) {
    console.error('Create Group Error:', err);
    return res.status(500).json({ error: 'An error occurred while creating group.' });
  }
}

// List all groups joined or created by user
async function listGroups(req, res) {
  try {
    const userId = req.user.id;

    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId: userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const groups = groupMemberships.map(gm => gm.group);
    return res.status(200).json(groups);
  } catch (err) {
    console.error('List Groups Error:', err);
    return res.status(500).json({ error: 'An error occurred while fetching groups.' });
  }
}

// Add group member by email
async function addGroupMember(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!targetUser) {
      return res.status(404).json({ error: `User with email '${email}' not found. Ask them to register first.` });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: targetUser.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this group.' });
    }

    // Add member
    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Member added successfully!',
      member: newMember.user
    });
  } catch (err) {
    console.error('Add Member Error:', err);
    return res.status(500).json({ error: 'An error occurred while adding member.' });
  }
}

// Remove group member
async function removeGroupMember(req, res) {
  try {
    const groupId = parseInt(req.params.id);
    const removeUserId = parseInt(req.params.userId);

    if (isNaN(groupId) || isNaN(removeUserId)) {
      return res.status(400).json({ error: 'Invalid group or user ID.' });
    }

    // Check if member exists in the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: removeUserId
        }
      }
    });

    if (!membership) {
      return res.status(404).json({ error: 'User is not a member of this group.' });
    }

    // Perform delete
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: removeUserId
        }
      }
    });

    return res.status(200).json({
      message: 'Member removed from group successfully.'
    });
  } catch (err) {
    console.error('Remove Member Error:', err);
    return res.status(500).json({ error: 'An error occurred while removing member.' });
  }
}

module.exports = {
  createGroup,
  listGroups,
  addGroupMember,
  removeGroupMember
};
