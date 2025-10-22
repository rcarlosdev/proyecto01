'use client';

// import MarketTable from "@/components/MarketTable";
import TradingDashboard from "@/components/TradingDashboard";
// import AlphaCandleChart from "@/components/AlphaCandleChart";
// import MarketTable from "@/components/MarketTable";

export const HomeView = () => {
  return (
    <div className="flex h-screen bg-black text-yellow-300 w-full">
      <TradingDashboard />
      {/* <MarketTable /> */}

    </div>
    // <div className="flex h-screen bg-black text-yellow-300">
    //   {/* Panel izquierdo */}
    //   <div className="w-[420px] border-r border-yellow-800 overflow-y-auto">
    //     <MarketTable />
    //   </div>

    //   {/* Panel derecho (gráfico) */}
    //   <div className="flex-1 flex flex-col">
    //     <div className="flex items-center justify-between p-3 border-b border-yellow-800 bg-zinc-950">
    //       <h1 className="text-lg font-bold text-yellow-400">Gráfico: </h1>
    //     </div>
    //     <div className="flex-1">
    //       {/* <MarketChart symbol={selected} /> */}
    //     </div>
    //   </div>
    // </div>
    // <div className="flex h-screen">

      // <MarketTable />

      // {/* <AlphaCandleChart symbol="TSLA" interval="15min" /> */ }

  // {/* <iframe
  //       src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_8e1a2&symbol=NASDAQ%3ATSLA&interval=15&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget_new&utm_campaign=chart&utm_term=NASDAQ%3ATSLA"
  //       // src="https://wt.rontoxm.com?jwttoken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJFbnZpZCI6ImFlMGUwMTE0LTUwYWYtNDU0Mi1hMmZlLWVjNjliMTdmNmE2MSIsIlRpbWVzdGFtcCI6MTc2MDQwMzU2NDAwMCwiVXNlcmlkIjoiMTI2MDI0NjkifQ.IN8yjUxVI5Yn4c-9y3Y8zpjry5oidXvHJdu7nCqtu4Y&isInIframe=true"
  //       className="w-full h-[500px]"
  //     ></iframe> */}

    // </div>
  );
}
