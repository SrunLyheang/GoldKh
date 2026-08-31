// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CsvDialog } from "./csv-dialog";

const HEADER = "type,quantity,unit,total_paid,currency,date,notes";

function csvFile(text: string) {
  return new File([text], "import.csv", { type: "text/csv" });
}

async function openImport(csv: string) {
  const user = userEvent.setup();
  render(
    <CsvDialog open onOpenChange={() => {}} rows={[]} onImported={() => {}} />
  );
  await user.click(screen.getAllByRole("button", { name: "Import" })[0]);
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, csvFile(csv));
  return user;
}

describe("CsvDialog import preview", () => {
  it("flags a bad row and disables commit while nothing is valid", async () => {
    await openImport(`${HEADER}\nbuy,-2,chi,100,USD,2026-08-01,\n`);

    expect(await screen.findByText("Invalid")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Import 0 rows/i })
    ).toBeDisabled();
  });

  it("enables commit once at least one row is valid", async () => {
    await openImport(
      `${HEADER}\nbuy,10,chi,3000,USD,2026-08-01,\nbuy,-2,chi,100,USD,2026-08-01,\n`
    );

    expect(await screen.findByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Import 1 row/i })
    ).toBeEnabled();
  });
});
