// A slim indeterminate progress bar, meant to sit above content that's being refreshed in place
// (the old content stays visible underneath, so this signals "updating" without a jarring
// full replace/blank state). Renders a fixed-height track so toggling `active` doesn't shift
// layout.
export function LoadingBar({ active }: { active: boolean }) {
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-transparent">
      {active && (
        <div className="h-full w-1/4 animate-[loading-bar-sweep_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
      )}
    </div>
  )
}
