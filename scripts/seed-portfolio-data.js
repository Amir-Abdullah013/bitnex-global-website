const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function seedPortfolioData() {
  try {
    console.log('🌱 Seeding portfolio data...');

    // Get all users
    const users = await prisma.user.findMany({
      where: { role: 'USER' }
    });

    console.log(`Found ${users.length} users to create portfolios for`);

    for (const user of users) {
      try {
        // Check if portfolio already exists
        const existingPortfolio = await prisma.portfolio.findUnique({
          where: { userId: user.id }
        });

        if (existingPortfolio) {
          console.log(`Portfolio already exists for user ${user.email}`);
          continue;
        }

        // Create portfolio
        const portfolio = await prisma.portfolio.create({
          data: {
            userId: user.id,
            totalValue: 0,
            totalPnl: 0,
            totalPnlPercent: 0,
            totalFees: 0,
            totalTrades: 0,
            winRate: 0,
            avgTradeSize: 0,
            bestTrade: 0,
            worstTrade: 0
          }
        });

        console.log(`✅ Created portfolio for user: ${user.email}`);

        // Create sample holdings if user has wallet
        const wallet = await prisma.wallet.findUnique({
          where: { userId: user.id }
        });

        if (wallet && (wallet.balance > 0 || wallet.bnxBalance > 0)) {
          const holdings = [];

          // USD holding
          if (wallet.balance > 0) {
            holdings.push({
              portfolioId: portfolio.id,
              asset: 'USD',
              amount: wallet.balance,
              avgPrice: 1.0,
              currentPrice: 1.0,
              value: wallet.balance,
              pnl: 0,
              pnlPercent: 0
            });
          }

          // BNX holding
          if (wallet.bnxBalance > 0) {
            const bnxPrice = 0.5; // Sample BNX price
            holdings.push({
              portfolioId: portfolio.id,
              asset: 'BNX',
              amount: wallet.bnxBalance,
              avgPrice: 0.4, // Sample average purchase price
              currentPrice: bnxPrice,
              value: wallet.bnxBalance * bnxPrice,
              pnl: wallet.bnxBalance * (bnxPrice - 0.4),
              pnlPercent: ((bnxPrice - 0.4) / 0.4) * 100
            });
          }

          if (holdings.length > 0) {
            await prisma.portfolioHolding.createMany({
              data: holdings
            });
            console.log(`✅ Created ${holdings.length} holdings for user: ${user.email}`);
          }
        }

        // Create sample analytics data for the last 30 days
        const analyticsData = [];
        const now = new Date();
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const baseValue = 1000 + Math.random() * 500; // Random base value
          const pnl = (Math.random() - 0.5) * 200; // Random P&L
          
          analyticsData.push({
            portfolioId: portfolio.id,
            date: date,
            totalValue: baseValue + pnl,
            totalPnl: pnl,
            totalPnlPercent: (pnl / baseValue) * 100,
            dailyTrades: Math.floor(Math.random() * 5),
            dailyVolume: Math.random() * 1000,
            dailyFees: Math.random() * 10
          });
        }

        await prisma.portfolioAnalytics.createMany({
          data: analyticsData
        });

        console.log(`✅ Created analytics data for user: ${user.email}`);

      } catch (error) {
        console.error(`❌ Error creating portfolio for user ${user.email}:`, error);
      }
    }

    console.log('✅ Portfolio data seeding completed');

  } catch (error) {
    console.error('❌ Error seeding portfolio data:', error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  seedPortfolioData()
    .then(async () => {
      console.log('✅ Portfolio data seeding completed');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Portfolio data seeding failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedPortfolioData };


