jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

describe("triggerTransaction", () => {
  const transactFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "triggerTransaction"
  );

  test("valid", async () => {
    await SmallcaseGateway.triggerTransaction(
      "test-token",
      {
        source: "test-source",
        campaign: "test-campaign",
      },
      ["kite", "axis"]
    );

    expect(transactFn).toHaveBeenNthCalledWith(
      1,
      "test-token",
      {
        source: "test-source",
        campaign: "test-campaign",
      },
      ["kite", "axis"]
    );

    await SmallcaseGateway.triggerTransaction("test-token");
    expect(transactFn).toHaveBeenNthCalledWith(2, "test-token", {}, []);
  });

  test("invalid", async () => {
    await SmallcaseGateway.triggerTransaction(null, {
      source: "test-source",
      campaign: "test-campaign",
    });
    expect(transactFn).toHaveBeenNthCalledWith(
      3,
      "",
      {
        source: "test-source",
        campaign: "test-campaign",
      },
      []
    );

    await SmallcaseGateway.triggerTransaction(123, "invalid");
    expect(transactFn).toHaveBeenNthCalledWith(4, "", {}, []);

    await SmallcaseGateway.triggerTransaction(null, null);
    expect(transactFn).toHaveBeenNthCalledWith(4, "", {}, []);

    await SmallcaseGateway.triggerTransaction(undefined, undefined);
    expect(transactFn).toHaveBeenNthCalledWith(5, "", {}, []);
  });

  test("default broker list", async () => {
    await SmallcaseGateway.setConfigEnvironment({
      brokerList: ["kite", "trustline"],
    });

    await SmallcaseGateway.triggerTransaction("test-token");
    expect(transactFn).toHaveBeenNthCalledWith(7, "test-token", {}, [
      "kite",
      "trustline",
    ]);

    await SmallcaseGateway.triggerTransaction("test-token", { a: "a" }, [
      "kite",
    ]);
    expect(transactFn).toHaveBeenNthCalledWith(8, "test-token", { a: "a" }, [
      "kite",
    ]);
  });
});
