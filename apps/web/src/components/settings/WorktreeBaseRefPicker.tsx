import { useDeferredValue, useState } from "react";

import { usePaginatedBranches } from "../../state/queries";
import { Button } from "../ui/button";
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxSearchInput,
  ComboboxStatus,
  ComboboxTrigger,
} from "../ui/combobox";
import { SelectButton } from "../ui/select";
import { useSettingsScope } from "./SettingsScopeContext";

export function WorktreeBaseRefPicker({
  value,
  mixed,
  onChange,
}: {
  value: string | null;
  mixed: boolean;
  onChange: (value: string | null) => void;
}) {
  const { scope, target } = useSettingsScope();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const deferredQuery = useDeferredValue(trimmedQuery);
  const member = scope.members.find(
    (candidate) =>
      candidate.environmentId === target?.environmentId && candidate.id === target?.projectId,
  );
  const branches = usePaginatedBranches({
    environmentId: open && member ? member.environmentId : null,
    cwd: open && member ? member.workspaceRoot : null,
    query: deferredQuery,
  });
  const refNames = branches.refs.map((ref) => ref.name);
  const matchingRefs = [...new Set([...(value ? [value] : []), ...refNames])].filter((ref) =>
    ref.toLowerCase().includes(trimmedQuery.toLowerCase()),
  );
  const customRef = trimmedQuery !== "" && !matchingRefs.includes(trimmedQuery);
  const items = [
    ...("repository default".includes(trimmedQuery.toLowerCase()) ? [""] : []),
    ...(customRef ? [trimmedQuery] : []),
    ...matchingRefs,
  ];

  return (
    <Combobox
      items={items}
      filteredItems={items}
      autoHighlight
      value={mixed ? null : (value ?? "")}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setQuery("");
      }}
      onValueChange={(next) => {
        if (next !== null) onChange(next || null);
      }}
    >
      <ComboboxTrigger aria-label="Worktree base ref" render={<SelectButton size="sm" />}>
        {mixed ? "Mixed" : (value ?? "Repository default")}
      </ComboboxTrigger>
      <ComboboxPopup align="end" className="flex w-72 flex-col">
        <ComboboxSearchInput
          aria-label="Search or enter a base ref"
          placeholder="Search or enter a ref…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxList>
          {items.map((ref) => (
            <ComboboxItem key={ref} value={ref}>
              <span className="truncate">
                {ref === ""
                  ? "Repository default"
                  : customRef && ref === trimmedQuery
                    ? `Use “${ref}”`
                    : ref}
              </span>
            </ComboboxItem>
          ))}
        </ComboboxList>
        {branches.data?.nextCursor != null ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={branches.isFetchingNextPage}
            onClick={() => branches.loadNext()}
          >
            {branches.isFetchingNextPage ? "Loading…" : "Load more refs"}
          </Button>
        ) : null}
        <ComboboxStatus>
          {branches.error
            ? "Could not load refs. You can still enter a branch, tag, or commit."
            : branches.isPending && branches.data === null
              ? "Loading refs…"
              : !member
                ? "Select a project for suggestions, or enter a branch, tag, or commit."
                : "Choose a ref, or enter a branch, tag, or commit."}
        </ComboboxStatus>
      </ComboboxPopup>
    </Combobox>
  );
}
