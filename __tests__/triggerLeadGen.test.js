jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

describe("triggerLeadGen", () => {
  const leadGenFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "triggerLeadGen"
  );

  test("valid", async () => {
    await SmallcaseGateway.triggerLeadGen({
      name: "test-name",
      phone: "test-phone",
    });
    expect(leadGenFn).toBeCalledWith({
      name: "test-name",
      phone: "test-phone",
    });

    await SmallcaseGateway.triggerLeadGen();
    expect(leadGenFn).toBeCalledWith({});
  });

  test("invalid", async () => {
    await SmallcaseGateway.triggerLeadGen("test-token");
    expect(leadGenFn).toBeCalledWith({});
  });
});
