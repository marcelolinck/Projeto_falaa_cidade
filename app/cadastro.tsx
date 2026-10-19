import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Cadastro() {

    return (
        <SafeAreaView style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
            <Text style={{color: 'blue'}}>Tela de cadastro</Text>
        </SafeAreaView>
    );  
}