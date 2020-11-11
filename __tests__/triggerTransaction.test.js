jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

test("triggerTransaction test", async () => {
  const transactFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "triggerTransaction"
  );

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
