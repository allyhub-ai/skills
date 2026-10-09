import { expect, test } from "claude-code/testing";

const PANE = {
  plugin: "allyhub",
  component: "Pane",
  requestId: "allyhub",
  props: {
    title: "AllyHub",
    isFocused: false,
    bodyColumns: 60,
    placement: "dock",
  },
} as const;

test("the pane says no preview runs yet, on every surface", async ($) => {
  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({ ...PANE, surface });
    expect(
      await ui.find({ type: "Text", text: /No preview is running yet/ }),
    ).toBeDefined();
    await ui.unmount();
  }
});

test("/allyhub opens the pane and says what it found", async ($, on) => {
  const opened: string[] = [];
  on("ui.open", ($2, e) => {
    opened.push(e.id);
    return { value: { isPlaced: true as const } };
  });
  const { text } = await $.command.run({ command: "allyhub", args: "" });
  expect(text).toMatch(/AllyHub/);
  expect(opened).toContain("allyhub");
});
