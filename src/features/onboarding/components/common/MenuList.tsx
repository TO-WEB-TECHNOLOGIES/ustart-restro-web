import { components } from "react-select";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const MenuList = (props: any) => {
  const { hasNextPage, isFetchingNextPage, fetchNextPage, t } =
    props.selectProps;
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px", // Fetch slightly before user reaches the absolute bottom
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <components.MenuList {...props}>
      {props.children}
      {hasNextPage && (
        <div ref={ref} className="p-4 text-center border-t border-slate-50">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 text-secondary-orange text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("Loading more...")}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {t("Scroll for more")}
            </div>
          )}
        </div>
      )}
    </components.MenuList>
  );
};
