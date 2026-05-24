import Inventory from "../models/Inventory.js";

export const getOrCreateInventory = async () => {
  let inventory = await Inventory.findOne();
  if (!inventory) {
    inventory = await Inventory.create({ sarees: 0, panchas: 0 });
  }
  return inventory;
};

