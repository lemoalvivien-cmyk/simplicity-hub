import { ChevronLeft, ChevronRight } from "lucide-react";

interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

export default function ListPagination({ page, pageSize, total, onPage }: ListPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{page + 1}</span> sur{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
        <span className="ml-2 text-muted-foreground/70">({total} résultats)</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} /> Précédent
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Suivant <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
