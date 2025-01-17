import os
from pathlib import Path
from typing import List


class FileProcessor:
    @staticmethod
    def sanitize_path(directory: str) -> str:
        # More sanitization can be added if needed, but these are the primary ones.
        sanitized_path = directory.replace('/', '_')
        sanitized_path = sanitized_path.replace('\\', '_')
        return sanitized_path

    @staticmethod
    def get_sub_dirs(directory: str):
        directory_path = Path(directory)
        sub_dirs = []
        for subdirectory in directory_path.iterdir():
            if subdirectory.is_dir():
                sub_dirs.append(subdirectory.name)
        return sub_dirs

    @staticmethod
    def get_script_files(directory: Path) -> List[Path]:
        return [Path(file[:-3]) for file in os.listdir(directory) if file.endswith('.js')]

    @staticmethod
    def get_content_to_write(sanitized_directory: str, script_files: List[Path]) -> str:
        return f"""
        let {sanitized_directory}_scripts = [{', '.join("'" + f.name + "'" for f in script_files)}]
        let {sanitized_directory}_paths = {sanitized_directory}_scripts.map(this._convertScriptToPath.bind(this, '{sanitized_directory}'));
"""

    @staticmethod
    def get_concat_str(directories: List[Path]) -> str:
        return ', '.join(f"{FileProcessor.sanitize_path(str(directory))}_paths" for directory in directories)


class JSFileContent:
    def __init__(self, directories: List[Path]):
        self.directories = directories
        self.file_processor = FileProcessor()
        self.js_file_content = """
var ScriptDefinitions = class {
    _convertScriptToPath(directory, scriptName) {
        return directory + '/' + scriptName + '.js';
    }

    getScriptPaths() {"""

    def generate_content(self) -> None:
        for directory in self.directories:
            script_files = self.file_processor.get_script_files(directory)
            script_files.sort()
            sanitized_directory: str = FileProcessor.sanitize_path(str(directory))
            self.js_file_content += self.file_processor.get_content_to_write(sanitized_directory, script_files)

        concat_str = self.file_processor.get_concat_str(self.directories)
        self.js_file_content += f"""
        return [].concat({concat_str}); """
        self.js_file_content += """
    }
}"""


class FileWriter:
    @staticmethod
    def write_file(js_file_content: str) -> None:
        js_path: Path = Path(os.path.dirname(__file__)).joinpath('init', '00-script-definitions.js')
        with open(js_path, 'w') as file:
            file.write(js_file_content)


def get_directory_tree(directory_names_to_include: List[str]) -> List[Path]:
    walked_directories = []

    for directory_name in directory_names_to_include:
        # Get subdirectories for this directory
        sub_directories = FileProcessor.get_sub_dirs(directory_name)

        # For each subdirectory, get its subdirectories recursively
        for sub_directory in sub_directories:
            full_path = f"{directory_name}/{sub_directory}"
            walked_directories.extend(get_directory_tree([full_path]))

        # Append the current directory after its subdirectories
        walked_directories.append(Path(directory_name))

    return walked_directories


if __name__ == '__main__':
    directories = ['lib', 'src']
    directories = get_directory_tree(directories)

    js_content = JSFileContent(directories)
    js_content.generate_content()
    FileWriter.write_file(js_content.js_file_content)
