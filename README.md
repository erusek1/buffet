# Buffett-Style Value Investing Application

A comprehensive value investing application based on Warren Buffett's principles for identifying and analyzing undervalued stocks.

## Features

- **Intrinsic Value Calculator**: Calculate stock intrinsic values using owner earnings with adjustable parameters for growth rate, discount rate, and margin of safety.
- **Market Scanner**: Automatically scan the market for value opportunities based on owner earnings approach.
- **Multiple Valuation Methods**: Cross-validate intrinsic value calculations using various approaches (DCF, Graham Number, PE Multiple, etc.).
- **Watchlist Management**: Track your value opportunities and get alerts when prices reach buy targets.
- **Conservative Valuations**: Follow Buffett's philosophy of conservative projections and appropriate margins of safety.

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/erusek1/buffet.git
   cd buffet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the root directory and add your Financial Modeling Prep API key:
   ```
   REACT_APP_FMP_API_KEY=your_api_key_here
   ```
   Note: You can get a free API key by signing up at [Financial Modeling Prep](https://financialmodelingprep.com/developer/docs/).

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Usage

### Intrinsic Value Calculator

1. Navigate to the "Value Calculator" page
2. Enter the stock's financial data (current earnings, depreciation, capex, etc.)
3. Adjust growth and discount rates according to your assessment of the business
4. Get a conservative intrinsic value estimate with an appropriate margin of safety

### Market Scanner

1. Navigate to the "Market Scanner" page
2. Click "Scan Market for Value Opportunities"
3. The application will analyze hundreds of stocks to find potential value opportunities
4. Filter the results by sector, market cap, valuation ratio, and moat rating

## Value Investing Principles

This application follows Warren Buffett's and Benjamin Graham's core value investing principles:

1. **Focus on Owner Earnings**: Instead of accounting earnings, we focus on owner earnings (Operating Cash Flow - Maintenance CapEx).
2. **Margin of Safety**: Always requiring a significant discount to intrinsic value.
3. **Business Quality**: Emphasizing companies with durable competitive advantages.
4. **Conservative Projections**: Using conservative growth rates and appropriate discount rates.
5. **Long-term Orientation**: Focusing on the long-term earning power of businesses.

## API Integration

The application integrates with the [Financial Modeling Prep API](https://financialmodelingprep.com/developer/docs/) to get real-time financial data. Different API tiers provide different levels of functionality:

- **Basic (Free)**: Limited to basic financial statements and stock quotes.
- **Starter ($19/mo)**: Adds access to more endpoints and higher rate limits.
- **Premium ($49/mo)**: Recommended for best experience with bulk data access.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Warren Buffett and Charlie Munger for their investment wisdom
- Benjamin Graham for the foundations of value investing
- The Financial Modeling Prep API team for providing financial data access