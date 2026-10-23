import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CategoriaType } from "@context/types";
import { useTheme } from "@context/ThemeContext";

type Props = {
  visible: boolean;
  categorias: CategoriaType[];
  selecionadas: string[];
  onChange: (ids: string[]) => void;
  onAdd: () => void;
  onClose: () => void;
};

export default function ModalSelecaoCategorias({ visible, categorias, selecionadas, onChange, onAdd, onClose }: Props) {
  const { colors } = useTheme();
  const ordenadas = useMemo(() => [...categorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [categorias]);
  const todasSelecionadas = ordenadas.length > 0 && ordenadas.every((categoria) => selecionadas.includes(String(categoria.id)));
  const alternarTodas = () => onChange(todasSelecionadas ? [] : ordenadas.map((categoria) => String(categoria.id)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <View style={[styles.header, { backgroundColor: colors.accentText }]}>
            <Text style={styles.title}>Ramos de atividade</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Fechar">
              <Ionicons name="close" size={22} color={colors.accentText} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.selectAll, { backgroundColor: colors.elevated, borderColor: colors.border }]} onPress={alternarTodas}>
            <Ionicons name={todasSelecionadas ? "checkbox" : "square-outline"} size={22} color={colors.primary} />
            <Text style={[styles.selectAllText, { color: colors.text }]}>{todasSelecionadas ? "Desmarcar todas" : "Selecionar todas"}</Text>
            <Text style={[styles.count, { color: colors.muted }]}>{selecionadas.length} selecionada(s)</Text>
          </TouchableOpacity>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {ordenadas.map((categoria, index) => {
              const id = String(categoria.id);
              const selected = selecionadas.includes(id);
              return (
                <View key={id}>
                  <TouchableOpacity style={[styles.option, selected && { backgroundColor: colors.accentText }]} onPress={() => onChange(selected ? selecionadas.filter((item) => item !== id) : [...selecionadas, id])}>
                    <Text style={[styles.optionText, { color: selected ? "#ffffff" : colors.text }]}>{categoria.nome}</Text>
                    <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? "#ffffff" : colors.muted} />
                  </TouchableOpacity>
                  {index < ordenadas.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              );
            })}
            {ordenadas.length === 0 && <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma categoria cadastrada.</Text>}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.addButton, { borderColor: colors.primary }]} onPress={onAdd}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>Nova categoria</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.accentText }]} onPress={onClose}>
              <Text style={styles.confirmButtonText}>Confirmar seleção</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 },
  modal: { width: "100%", maxWidth: 420, maxHeight: "85%", borderRadius: 20, overflow: "hidden" },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  title: { flex: 1, color: "#ffffff", textAlign: "center", fontSize: 19, fontWeight: "700" },
  closeButton: { position: "absolute", right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  selectAll: { minHeight: 50, marginHorizontal: 12, marginTop: 12, paddingHorizontal: 12, borderWidth: 1, borderRadius: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  selectAllText: { flex: 1, fontSize: 13, fontWeight: "700" },
  count: { fontSize: 11 },
  list: { flexShrink: 1, marginTop: 4 },
  option: { minHeight: 54, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { fontSize: 14, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  empty: { textAlign: "center", padding: 28, fontSize: 14 },
  actions: { padding: 14, gap: 9 },
  addButton: { minHeight: 43, borderWidth: 1, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  addButtonText: { fontSize: 13, fontWeight: "700" },
  confirmButton: { minHeight: 46, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
