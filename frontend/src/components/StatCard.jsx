import { motion } from "framer-motion";

const StatCard = ({ title, value, subtitle }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="temple-card p-4"
  >
    <p className="text-sm text-templeCream/80">{title}</p>
    <h3 className="mt-2 font-heading text-3xl text-templeGold">{value}</h3>
    {subtitle && <p className="mt-2 text-xs text-templeCream/75">{subtitle}</p>}
  </motion.article>
);

export default StatCard;

