jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

test("triggerLeadGen test", async () => {
  const leadGenFn = jest.spyOn(
    NativeModules.SmallcaseGateway,
    "triggerLeadGen"
  );

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

  await SmallcaseGateway.triggerLeadGen("test-token");
  expect(leadGenFn).toBeCalledWith({});
});
