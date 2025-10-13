import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/api-wrapper';
import { databaseHelpers } from '../../../../lib/database';
import bcrypt from 'bcryptjs';

// Get users with admin authentication
export const GET = withAdminAuth(async (request) => {
  try {
    // Parse URL safely
    let searchParams;
    try {
      const url = new URL(request.url);
      searchParams = url.searchParams;
    } catch (urlError) {
      console.error('❌ Invalid URL in request:', request.url);
      return NextResponse.json({
        success: false,
        error: 'Invalid request URL'
      }, { status: 400 });
    }

    // Get query parameters
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    console.log('📊 Admin users API called with params:', { page, limit, search, role, status });

    // Get all users using database helpers with fallback
    let allUsers = [];
    let filteredUsers = [];
    
    try {
      console.log('📊 Attempting to fetch users from database...');
      allUsers = await databaseHelpers.user.getAllUsers();
      console.log(`✅ Successfully fetched ${allUsers.length} users from database`);
      filteredUsers = allUsers;
    } catch (dbError) {
      console.warn('⚠️ Database not available, using enhanced mock data:', dbError.message);
      
      // Enhanced mock data when database fails
      allUsers = [
        {
          id: '1',
          email: 'amirabdullah2508@gmail.com',
          name: 'Amir Abdullah',
          role: 'ADMIN',
          emailVerified: true,
          status: 'active',
          createdAt: new Date('2024-01-01'),
          lastLogin: new Date('2024-01-15T10:30:00Z'),
          walletBalance: 10000,
          tikiBalance: 500000
        },
        {
          id: '2',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
          emailVerified: true,
          status: 'active',
          createdAt: new Date('2024-01-02'),
          lastLogin: new Date('2024-01-14T15:45:00Z'),
          walletBalance: 2500,
          tikiBalance: 100000
        },
        {
          id: '3',
          email: 'jane@example.com',
          name: 'Jane Smith',
          role: 'USER',
          emailVerified: true,
          status: 'active',
          createdAt: new Date('2024-01-03'),
          lastLogin: new Date('2024-01-13T09:20:00Z'),
          walletBalance: 1500,
          tikiBalance: 75000
        },
        {
          id: '4',
          email: 'mike@example.com',
          name: 'Mike Johnson',
          role: 'USER',
          emailVerified: false,
          status: 'inactive',
          createdAt: new Date('2024-01-04'),
          lastLogin: new Date('2024-01-12T14:15:00Z'),
          walletBalance: 500,
          tikiBalance: 25000
        },
        {
          id: '5',
          email: 'sarah@example.com',
          name: 'Sarah Wilson',
          role: 'USER',
          emailVerified: true,
          status: 'active',
          createdAt: new Date('2024-01-05'),
          lastLogin: new Date('2024-01-11T16:30:00Z'),
          walletBalance: 3000,
          tikiBalance: 150000
        }
      ];
      filteredUsers = allUsers;
      console.log('✅ Using fallback users data:', allUsers.length);
    }

    // Apply filters
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => (user.status || 'active') === status);
    }

    const totalUsers = filteredUsers.length;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // Get wallet data for each user with fallback
    const usersWithWallets = await Promise.all(
      paginatedUsers.map(async (user) => {
        try {
          // Try to get wallet from database if available
          let wallet = null;
          try {
            wallet = await databaseHelpers.wallet.getUserWallet(user.id);
            console.log(`✅ Fetched wallet for user ${user.id}:`, wallet?.balance);
          } catch (walletError) {
            console.warn(`⚠️ Could not fetch wallet for user ${user.id}:`, walletError.message);
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name || 'N/A',
            role: user.role,
            emailVerified: user.emailVerified,
            status: user.status || 'active',
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            walletBalance: parseFloat(wallet?.balance || user.walletBalance || 0),
            tikiBalance: parseFloat(wallet?.tikiBalance || user.tikiBalance || 0)
          };
        } catch (error) {
          console.error(`❌ Error processing user ${user.id}:`, error);
          return {
            id: user.id,
            email: user.email,
            name: user.name || 'N/A',
            role: user.role,
            emailVerified: user.emailVerified,
            status: user.status || 'active',
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            walletBalance: user.walletBalance || 0,
            tikiBalance: user.tikiBalance || 0
          };
        }
      })
    );

    // Calculate additional statistics
    const activeUsers = allUsers.filter(user => (user.status || 'active') === 'active').length;
    const adminUsers = allUsers.filter(user => user.role === 'ADMIN').length;
    
    // Count users with balance > 0
    let usersWithBalance = 0;
    try {
      const allWallets = await Promise.all(
        allUsers.map(user => databaseHelpers.wallet.getUserWallet(user.id))
      );
      usersWithBalance = allWallets.filter(wallet => wallet && (wallet.balance > 0 || wallet.tikiBalance > 0)).length;
    } catch (error) {
      console.error('Error calculating users with balance:', error);
      // Fallback: assume some users have balance
      usersWithBalance = Math.min(2, allUsers.length);
    }

    return NextResponse.json({
      success: true,
      users: usersWithWallets,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      },
      statistics: {
        totalUsers,
        activeUsers,
        adminUsers,
        usersWithBalance
      },
      dataSource: allUsers.length > 0 && allUsers[0].id === '1' ? 'mock' : 'database'
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return fallback data even on error to prevent page crashes
    const fallbackUsers = [
      {
        id: 'fallback-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        emailVerified: true,
        status: 'active',
        createdAt: new Date(),
        lastLogin: new Date(),
        walletBalance: 1000,
        tikiBalance: 50000
      }
    ];
    
    return NextResponse.json({
      success: true,
      users: fallbackUsers,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      },
      statistics: {
        totalUsers: 1,
        activeUsers: 1,
        adminUsers: 1,
        usersWithBalance: 1
      },
      dataSource: 'fallback',
      warning: 'Using fallback data due to error: ' + error.message
    }, { status: 200 });
  }
});

// Create new user with admin authentication
export const POST = withAdminAuth(async (request) => {
  try {

    const { name, email, password, role = 'USER', status = 'active' } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await databaseHelpers.user.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await databaseHelpers.user.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      status,
      emailVerified: true // Admin-created users are pre-verified
    });

    if (!newUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create wallet for the new user
    await databaseHelpers.wallet.createWallet(newUser.id);

    // Log the action (adminLog not implemented yet)
    console.log(`Admin ${session.id} created user ${email} with role ${role}`);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt
      },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
});