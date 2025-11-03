"use client";

import { useMarketStore } from "@/stores/useMarketStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/stores/useUserStore";

export default function AccountInfo() {
  const { isLoading } = useMarketStore();
  const { user } = useUserStore();  

  const accountData = [
    { label: "Patrimonio neto", value: user?.balance || 0 },
    { label: "Margen libre", value: 0 || 0 },
    { label: "Margen usado", value: 0 || 0 },
    { label: "P/L abiertas", value: 0 || 0 },
    { label: "Saldo", value: 0 || 0 },
    { label: "Nivel de margen", value: 0 || 0 },
    { label: "Crédito", value: 0 || 0 },
  ];

  // <div class="jss1729 jss1739"><div id="desktop_tourGuide_step_1" class="jss1730 jss1740"><div class="jss1731 jss1741"><button class="MuiButtonBase-root MuiButton-root MuiButton-text jss1732 jss1742 undefined MuiButton-disableElevation" tabindex="0" type="button" id="dashboardLayout_bottom-btn"><span class="MuiButton-label"><svg class="MuiSvgIcon-root" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path></svg></span><div style="position: absolute; inset: 0px; overflow: hidden; z-index: -1; visibility: hidden;"><div style="position: absolute; left: 0px; top: 0px; width: 1e+07px; height: 1e+07px;"></div></div><div style="position: absolute; inset: 0px; overflow: hidden; z-index: -1; visibility: hidden;"><div style="position: absolute; left: 0px; top: 0px; width: 200%; height: 200%;"></div></div></button></div><div class="jss3588"><div class="jss3596"><div id="mobile_tourGuide_step_1" class="jss3597 jss3604"><div class="jss3602"><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">Patrimonio neto</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary"><span class="MuiTypography-root jss3614 MuiTypography-body2 MuiTypography-colorInherit MuiTypography-displayInline">€</span>770.27</p></div><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">Margen libre</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary"><span class="MuiTypography-root jss3614 MuiTypography-body2 MuiTypography-colorInherit MuiTypography-displayInline">€</span>770.27</p></div><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">Margen usado</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary"><span class="MuiTypography-root jss3614 MuiTypography-body2 MuiTypography-colorInherit MuiTypography-displayInline">€</span>0.00</p></div><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">P/L abiertas</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary"><span class="MuiTypography-root jss3614 MuiTypography-body2 MuiTypography-colorInherit MuiTypography-displayInline">€</span>0.00</p></div><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">Saldo</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary"><span class="MuiTypography-root jss3614 MuiTypography-body2 MuiTypography-colorInherit MuiTypography-displayInline">€</span>520.27</p></div><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">Nivel de margen</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary">---</p></div><div class="jss3606"><div class="jss3610"><p class="MuiTypography-root jss1899 MuiTypography-body1 MuiTypography-colorTextSecondary">Crédito</p></div><p class="MuiTypography-root jss1896 MuiTypography-body1 MuiTypography-colorTextPrimary"><span class="MuiTypography-root jss3614 MuiTypography-body2 MuiTypography-colorInherit MuiTypography-displayInline">€</span>250.00</p></div></div></div></div></div></div></div>

  return (
    <div className="rounded-2xl border border-border/40 p-4 md:p-6">
      <h2 className="text-base font-semibold mb-4 text-foreground/80">
        Información de cuenta
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-8 gap-y-4 gap-x-6">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          : accountData.map((item, index) => (
              <div key={index} className="col-span-1">
                <p className="text-xs text-muted-foreground mb-1 tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-foreground/90">
                  $ {item.value}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}
