import { 
    List,
    Datagrid,
    TextField,
    TextInput,
    NumberField,
    NumberInput,
    Show,
    SimpleShowLayout,
    Edit,
    SimpleForm,
    Create,
    ReferenceField,
    ReferenceInput
} from "react-admin";

export const GradesList = () => (
    <List>
        <Datagrid rowClick = "show">
            <TextField source = "id"/>
            <ReferenceField source = "student_id" reference = "students"/>
            <TextField source = "type"/>
            <NumberField source = "grade"/>
            <NumberField source = "max"/>
        </Datagrid>
    </List>
);

export const GradesShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source = "id"/>
            <ReferenceField source = "student_id" reference = "students"/>
            <TextField source = "type"/>
            <NumberField source = "grade"/>
            <NumberField source = "max"/>        
        </SimpleShowLayout>
    </Show>
);

export const GradesEdit = () => (
    <Edit>
        <SimpleForm>
            <TextField source = "id"/>
            <ReferenceInput source = "student_id" reference = "students"/>
            <TextInput source = "type"/>
            <NumberInput source = "grade"/>
            <NumberInput source = "max"/>        
        </SimpleForm>
    </Edit>
);

export const GradesCreate = () => (
    <Create>
        <SimpleForm>
            <ReferenceInput source = "student_id" reference = "students"/>
            <TextInput source = "type"/>
            <NumberInput source = "grade"/>
            <NumberInput source = "max"/>     
        </SimpleForm>
    </Create>
);