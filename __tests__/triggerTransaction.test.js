jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

describe("triggerTransaction", () => {
  const transactFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "triggerTransaction"
  );

  test("valid", async () => {
    await SmallcaseGateway.triggerTransaction("test-token", {
      source: "test-source",
      campaign: "test-campaign",
    });

    expect(transactFn).toBeCalledWith("test-token", {
      source: "test-source",
      campaign: "test-campaign",
    });

    await SmallcaseGateway.triggerTransaction("test-token");
    expect(transactFn).toBeCalledWith("test-token", {});
  });

  test("invalid", async () => {
    await SmallcaseGateway.triggerTransaction(null, {
      source: "test-source",
      campaign: "test-campaign",
    });
    expect(transactFn).toBeCalledWith("", {
      source: "test-source",
      campaign: "test-campaign",
    });

    await SmallcaseGateway.triggerTransaction(123, "invalid");
    expect(transactFn).toBeCalledWith("", {});
  });
});
